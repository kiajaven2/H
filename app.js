/* ============================================================================
   app.js — runs the 3-stage journey:
     Stage 1: quiz (data/quiz.js)  →  Stage 2: memes (data/memes.js)
     →  Stage 3: balloon finale (data/messages.js + window.FINALE).
   Stage 3 is a decorated scene (presents + balloons on the ground). Balloons rise
   ONE AT A TIME in messages.js order; she pops each → message/voice popup → next rises.
   Side controls: "release all" (free-pick mode) and "rewind" (restart). Ends on a
   custom closing card + confetti.
   Vanilla JS, no build step.
   ============================================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // --- shared elements ---
  var dialog = document.getElementById("message-dialog");
  var nameEl = document.getElementById("dlg-name");
  var messageEl = document.getElementById("dlg-message");
  var audioSlot = document.getElementById("dlg-audio");
  var imageSlot = document.getElementById("dlg-image");
  var closeBtn = document.getElementById("dialog-close");

  // --- stage-3 elements ---
  var air = document.getElementById("balloon-air");
  var emptyState = document.getElementById("empty-state");
  var progressCount = document.getElementById("progress-count");
  var releaseBtn = document.getElementById("release-all");
  var rewindBtn = document.getElementById("rewind");
  var finaleCard = document.getElementById("finale-card");
  var finaleTitleEl = document.getElementById("finale-title");
  var finaleMsgEl = document.getElementById("finale-message");
  var finaleReplay = document.getElementById("finale-replay");

  var COLOR_HUES = { pink: 338, mint: 152, peach: 24, lavender: 272, yellow: 46, sky: 200 };
  var PALETTE = [338, 152, 24, 272, 46, 200, 318, 180];
  var MAX_NAME = 60, MAX_MSG = 1500;

  // --- stage-3 state ---
  var allMessages = [];   // full prepared list (for rewind)
  var queue = [];         // not-yet-shown, in order
  var balloons = [];      // currently in #balloon-air (free mode)
  var mode = "sequential"; // "sequential" | "free" | "done"
  var shownCount = 0, totalCount = 0;
  var activeBalloon = null, activeMsg = null;
  var advanceTimer = null;
  var lastBalloon = null;
  var musicPausedForVoice = false;

  function clampStr(s, max) {
    s = String(s == null ? "" : s).trim();
    return s.length > max ? s.slice(0, max) + "…" : s;
  }
  function safeStorage(fn) { try { return fn(); } catch (e) { return null; } }
  function jitter(i, salt) {
    var v = Math.sin((i + 1) * salt) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1;
  }

  /* ========================= Starfield ==================================== */
  function buildSparkles() {
    var field = document.getElementById("starfield");
    if (!field) return;
    var count = window.innerWidth < 600 ? 32 : 50;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.className = "sparkle";
      var size = (1.5 + Math.random() * 2.4).toFixed(1);
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.top = (Math.random() * 100).toFixed(2) + "%";
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.setProperty("--tw", (2.4 + Math.random() * 3).toFixed(2) + "s");
      s.style.setProperty("--td", (Math.random() * 4).toFixed(2) + "s");
      frag.appendChild(s);
    }
    field.appendChild(frag);
  }

  /* ========================= Stage manager ================================ */
  var stageEls = {
    1: document.getElementById("stage-quiz"),
    2: document.getElementById("stage-memes"),
    3: document.getElementById("stage-balloons")
  };
  var dots = Array.prototype.slice.call(document.querySelectorAll(".progress-dot"));
  var current = 1, maxReached = 1, finaleEntered = false;

  function updateDots() {
    dots.forEach(function (d) {
      var s = +d.dataset.stage;
      d.classList.toggle("is-active", s === current);
      d.classList.toggle("is-done", s < maxReached && s !== current);
    });
  }

  function showStage(n) {
    Object.keys(stageEls).forEach(function (k) {
      var el = stageEls[k];
      if (!el) return;
      var on = (+k === n);
      el.hidden = !on;
      el.classList.toggle("is-active", on);
    });
    current = n;
    if (n > maxReached) maxReached = n;
    updateDots();

    var heading = stageEls[n] && stageEls[n].querySelector(".stage-title, .hero-title, .finale-prompt");
    if (heading) { heading.setAttribute("tabindex", "-1"); try { heading.focus({ preventScroll: true }); } catch (e) {} }
    window.scrollTo(0, 0);

    if (n === 3) enterFinale();
  }

  dots.forEach(function (d) {
    d.addEventListener("click", function () {
      var s = +d.dataset.stage;
      if (s <= maxReached) showStage(s); // only revisit unlocked stages
    });
  });

  /* ========================= Stage 1: quiz ================================ */
  function buildQuiz() {
    var host = document.getElementById("quiz-host");
    if (!host) return;
    var data = Array.isArray(window.QUIZ) ? window.QUIZ : [];

    if (!data.length) {
      var go = document.createElement("button");
      go.className = "cta-btn";
      go.type = "button";
      go.textContent = "يلا نبدأ ➜";
      go.addEventListener("click", function () { showStage(2); });
      host.appendChild(go);
      return;
    }

    var qi = 0;
    var locked = false;

    function optLabel(o) { return (o && typeof o === "object") ? o.label : o; }
    function optReply(o) { return (o && typeof o === "object") ? o.reply : null; }

    function renderQuestion() {
      locked = false;
      var item = data[qi] || {};
      host.replaceChildren();

      var q = document.createElement("p");
      q.className = "quiz-question";
      q.dir = "auto";
      q.textContent = item.q || "";
      host.appendChild(q);

      var opts = document.createElement("div");
      opts.className = "quiz-options";
      (item.options || []).forEach(function (opt, idx) {
        var b = document.createElement("button");
        b.className = "quiz-option";
        b.type = "button";
        b.dir = "auto";
        b.textContent = optLabel(opt);
        b.addEventListener("click", function () { answer(idx, b, item, opts); });
        opts.appendChild(b);
      });
      host.appendChild(opts);

      var fb = document.createElement("p");
      fb.className = "quiz-feedback";
      fb.setAttribute("aria-live", "polite");
      fb.dir = "auto";
      fb.id = "quiz-feedback";
      host.appendChild(fb);
    }

    function answer(idx, btn, item, opts) {
      if (locked) return;
      locked = true;

      var fb = document.getElementById("quiz-feedback");
      var chosen = (item.options || [])[idx];
      var isWrong = (item.correct != null) && (idx !== item.correct);

      btn.classList.add(isWrong ? "is-wrong" : "is-correct");
      Array.prototype.forEach.call(opts.children, function (c) { c.disabled = true; });

      var reply = optReply(chosen) || (isWrong ? item.wrong : item.right) || "";
      if (fb) fb.textContent = reply;

      if (!isWrong && !reduceMotion.matches && typeof window.popConfetti === "function") {
        var r = btn.getBoundingClientRect();
        window.popConfetti(r.left + r.width / 2, r.top + r.height / 2);
      }

      setTimeout(function () {
        qi++;
        if (qi < data.length) renderQuestion();
        else showStage(2);
      }, 1900);
    }

    renderQuestion();
  }

  /* ========================= Stage 2: memes =============================== */
  function buildMemes() {
    var grid = document.getElementById("memes-grid");
    var nextBtn = document.getElementById("memes-next");
    if (!grid) return;
    var data = Array.isArray(window.MEMES) ? window.MEMES : [];

    data.forEach(function (m) {
      if (!m || !m.src) return;
      var fig = document.createElement("figure");
      fig.className = "meme";

      var img = document.createElement("img");
      img.src = m.src;
      img.alt = m.caption ? m.caption : "ميم";
      img.loading = "lazy";
      img.addEventListener("error", function () {
        img.remove();
        var note = document.createElement("div");
        note.className = "meme-missing";
        note.style.cssText = "padding:1.4em;color:var(--ink-soft);font-size:.95rem;";
        note.textContent = "تعذّر تحميل: " + m.src;
        fig.insertBefore(note, fig.firstChild);
      });
      fig.appendChild(img);

      if (m.caption) {
        var cap = document.createElement("figcaption");
        cap.dir = "auto";
        cap.textContent = m.caption;
        fig.appendChild(cap);
      }
      grid.appendChild(fig);
    });

    if (nextBtn) nextBtn.addEventListener("click", function () { showStage(3); });
  }

  /* ========================= Stage 3: balloon finale ====================== */
  function prepareMessages() {
    var data = Array.isArray(window.MESSAGES) ? window.MESSAGES : [];
    allMessages = data.filter(function (m) {
      return m && m.approved !== false && (m.name || m.message || m.voice || m.image);
    }).map(function (m, i) {
      return {
        name: clampStr(m.name || "صديق", MAX_NAME),
        message: clampStr(m.message || "", MAX_MSG),
        lang: m.lang === "en" ? "en" : "ar",
        voice: m.voice || null,
        image: m.image || null,
        hue: (COLOR_HUES[m.color] != null) ? COLOR_HUES[m.color] : PALETTE[i % PALETTE.length]
      };
    });
    totalCount = allMessages.length;
  }

  function makeBalloonEl(msg) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "balloon";
    btn.style.setProperty("--hue", msg.hue);
    btn.setAttribute("aria-label", "رسالة من " + msg.name);
    btn.dataset.name = msg.name;
    btn.dataset.message = msg.message;
    btn.dataset.lang = msg.lang;
    if (msg.voice) btn.dataset.voice = msg.voice;
    if (msg.image) btn.dataset.image = msg.image;

    var label = document.createElement("span");
    label.className = "balloon-name";
    label.dir = "auto";
    label.textContent = msg.name;
    btn.appendChild(label);
    return btn;
  }

  function updateControls() {
    // "release all" only makes sense in sequential mode while balloons still wait in the queue
    if (releaseBtn) releaseBtn.hidden = (mode !== "sequential") || (queue.length === 0);
    if (rewindBtn) rewindBtn.hidden = (mode === "done");
  }

  function setCounterSeq() { if (progressCount) progressCount.textContent = "🎈 " + shownCount + " / " + totalCount; }
  function setCounterFree(remaining) { if (progressCount) progressCount.textContent = "🎈 باقي " + remaining; }

  function clearAir() {
    air.querySelectorAll(".balloon").forEach(function (b) { b.remove(); });
    activeBalloon = null;
    activeMsg = null;
    balloons = [];
  }

  // sequential: show the next single balloon, rising from the ground
  function showNextBalloon() {
    if (mode !== "sequential") return;
    if (!queue.length) { showFinale(); return; }
    var msg = queue.shift();
    shownCount++;
    setCounterSeq();

    var el = makeBalloonEl(msg);
    el.classList.add("balloon--active");
    air.appendChild(el);
    activeBalloon = el;
    activeMsg = msg;
    updateControls();
    try { el.focus({ preventScroll: true }); } catch (e) {}
  }

  // free mode: release every remaining balloon at once; she picks any order
  function releaseAll() {
    if (mode !== "sequential") return;
    clearTimeout(advanceTimer);
    mode = "free";

    var msgs = [];
    if (activeMsg) msgs.push(activeMsg);  // the one currently up, if not yet popped
    msgs = msgs.concat(queue);
    queue = [];
    clearAir();

    msgs.forEach(function (msg) {
      var el = makeBalloonEl(msg);
      if (!reduceMotion.matches) el.classList.add("balloon--enter");
      air.appendChild(el);
      balloons.push(el);
    });
    scatterFree(balloons);
    setCounterFree(balloons.length);
    updateControls();
    if (balloons[0]) { try { balloons[0].focus({ preventScroll: true }); } catch (e) {} }
  }

  // spread the free-mode balloons across the air using % positions (no page growth)
  function scatterFree(els) {
    var n = els.length;
    if (!n) return;
    var cols = n <= 2 ? n : (window.innerWidth < 560 ? 2 : 3);
    var rows = Math.ceil(n / cols);
    els.forEach(function (el, i) {
      var c = i % cols, r = Math.floor(i / cols);
      var x = cols === 1 ? 50 : 16 + 68 * (c / (cols - 1));
      var y = rows === 1 ? 36 : 16 + 44 * (r / (rows - 1));
      x += jitter(i, 12.9898) * 6;
      y += jitter(i, 78.233) * 5;
      el.style.setProperty("--x", Math.min(90, Math.max(10, x)).toFixed(1) + "%");
      el.style.setProperty("--y", Math.min(64, Math.max(8, y)).toFixed(1) + "%");
    });
  }

  function startSequence() {
    clearTimeout(advanceTimer);
    clearAir();
    if (finaleCard) finaleCard.hidden = true;
    mode = "sequential";
    queue = allMessages.slice();
    shownCount = 0;
    setCounterSeq();
    updateControls();
    showNextBalloon();
  }

  function showFinale() {
    clearAir();
    mode = "done";
    updateControls();
    if (progressCount) progressCount.textContent = "";

    var f = window.FINALE || {};
    if (finaleTitleEl) finaleTitleEl.textContent = f.title || "كل عام وانتي بخير يا حوراء 🎂";
    if (finaleMsgEl) { finaleMsgEl.textContent = f.message || "نتمنى لكِ سنة مليئة بالفرح والهامستر 💛🐹"; finaleMsgEl.dir = "auto"; }
    if (finaleCard) finaleCard.hidden = false;

    if (!reduceMotion.matches && typeof window.popConfetti === "function") {
      var W = window.innerWidth, H = window.innerHeight;
      window.popConfetti(W * 0.5, H * 0.42);
      setTimeout(function () { window.popConfetti(W * 0.25, H * 0.5); }, 220);
      setTimeout(function () { window.popConfetti(W * 0.75, H * 0.5); }, 420);
    }
    if (finaleReplay) { try { finaleReplay.focus({ preventScroll: true }); } catch (e) {} }
  }

  function enterFinale() {
    if (finaleEntered) return;
    finaleEntered = true;
    prepareMessages();
    if (!allMessages.length) {
      if (emptyState) emptyState.hidden = false;
      if (releaseBtn) releaseBtn.hidden = true;
      if (rewindBtn) rewindBtn.hidden = true;
      return;
    }
    startSequence();
  }

  /* ========================= Pop + reveal ================================ */
  function popBalloon(btn) {
    if (!btn || btn.classList.contains("balloon--pop")) return;
    lastBalloon = btn;

    if (reduceMotion.matches) { openDialog(btn); return; }

    var rect = btn.getBoundingClientRect();
    btn.classList.add("balloon--pop");
    if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
    if (typeof window.popConfetti === "function") {
      window.popConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    setTimeout(function () { openDialog(btn); }, 240);
  }

  function openDialog(btn) {
    var lang = btn.dataset.lang === "en" ? "en" : "ar";
    nameEl.textContent = btn.dataset.name;
    nameEl.dir = "auto";
    messageEl.textContent = btn.dataset.message;
    messageEl.lang = lang;
    messageEl.dir = lang === "en" ? "ltr" : "rtl";

    audioSlot.replaceChildren();
    imageSlot.replaceChildren();

    if (btn.dataset.image) {
      var img = document.createElement("img");
      img.src = btn.dataset.image;
      img.alt = "صورة من " + btn.dataset.name;
      img.addEventListener("error", function () {
        imageSlot.replaceChildren();
        var n = document.createElement("p");
        n.className = "audio-missing";
        n.textContent = "تعذّر تحميل الصورة 📷";
        imageSlot.appendChild(n);
      });
      imageSlot.appendChild(img);
    }

    if (btn.dataset.voice) {
      var audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "auto";
      audio.src = btn.dataset.voice;
      audio.addEventListener("error", function () {
        audioSlot.replaceChildren();
        var note = document.createElement("p");
        note.className = "audio-missing";
        note.textContent = "تعذّر تشغيل الرسالة الصوتية في هذا المتصفح 🎙️";
        audioSlot.appendChild(note);
      });
      audioSlot.appendChild(audio);

      musicPauseForVoice(); // duck the background song while the voice note plays
      var pp = audio.play();
      if (pp && typeof pp.catch === "function") pp.catch(function () {});
    }

    if (typeof dialog.showModal === "function") dialog.showModal();
    else { dialog.setAttribute("open", ""); closeBtn.focus(); }
  }

  function closeDialog() { if (dialog.open) dialog.close(); }

  function handleClosed() {
    var a = audioSlot.querySelector("audio");
    if (a) { try { a.pause(); } catch (e) {} }
    audioSlot.replaceChildren();

    musicResumeAfterVoice(); // bring the background song back after the voice note

    var btn = lastBalloon;
    lastBalloon = null;
    if (!btn) return;
    btn.remove();

    if (mode === "free") {
      balloons = balloons.filter(function (b) { return b !== btn; });
      var remaining = air.querySelectorAll(".balloon").length;
      setCounterFree(remaining);
      if (remaining === 0) { showFinale(); }
      else { var nx = air.querySelector(".balloon"); if (nx) { try { nx.focus({ preventScroll: true }); } catch (e) {} } }
    } else if (mode === "sequential") {
      activeBalloon = null;
      activeMsg = null;
      updateControls();
      advanceTimer = setTimeout(showNextBalloon, 700);
    }
  }

  air.addEventListener("click", function (e) {
    var btn = e.target.closest(".balloon");
    if (btn) popBalloon(btn);
  });
  closeBtn.addEventListener("click", closeDialog);
  dialog.addEventListener("click", function (e) {
    var r = dialog.getBoundingClientRect();
    var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeDialog();
  });
  dialog.addEventListener("close", handleClosed);

  if (releaseBtn) releaseBtn.addEventListener("click", releaseAll);
  if (rewindBtn) rewindBtn.addEventListener("click", startSequence);
  if (finaleReplay) finaleReplay.addEventListener("click", startSequence);

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (mode === "free") scatterFree(balloons); }, 120);
  }, { passive: true });

  /* ===== Background music — soft instrumental via the YouTube IFrame API ===== */
  var YT_ID = "TorMYUdoV5k";
  var MUSIC_KEY = "hawraa-music";
  var MUSIC_VOL = 14; // 0-100, kept low for a soft background
  var ytPlayer = null, ytReady = false, ytWantPlay = false;
  var musicBtn = document.getElementById("music-toggle");

  function musicPressed(on) { if (musicBtn) musicBtn.setAttribute("aria-pressed", on ? "true" : "false"); }
  function musicIsPlaying() { try { return !!ytPlayer && ytReady && ytPlayer.getPlayerState() === 1; } catch (e) { return false; } }
  function musicPlay() {
    if (ytReady && ytPlayer) { try { ytPlayer.setVolume(MUSIC_VOL); ytPlayer.playVideo(); } catch (e) {} }
    else { ytWantPlay = true; }
    musicPressed(true);
    safeStorage(function () { localStorage.setItem(MUSIC_KEY, "on"); });
  }
  function musicStop() {
    ytWantPlay = false;
    if (ytReady && ytPlayer) { try { ytPlayer.pauseVideo(); } catch (e) {} }
    musicPressed(false);
    safeStorage(function () { localStorage.setItem(MUSIC_KEY, "off"); });
  }
  function musicPauseForVoice() { if (musicIsPlaying()) { musicPausedForVoice = true; try { ytPlayer.pauseVideo(); } catch (e) {} } }
  function musicResumeAfterVoice() { if (musicPausedForVoice) { musicPausedForVoice = false; try { if (ytPlayer) ytPlayer.playVideo(); } catch (e) {} } }

  // Called by the YouTube IFrame API once it has loaded (script tag in index.html).
  window.onYouTubeIframeAPIReady = function () {
    try {
      ytPlayer = new YT.Player("yt-bg", {
        videoId: YT_ID,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, loop: 1, playlist: YT_ID, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: function (e) {
            ytReady = true;
            try { e.target.setVolume(MUSIC_VOL); } catch (_) {}
            if (ytWantPlay) { try { e.target.playVideo(); } catch (_) {} }
          },
          // loop backup: if it ever ends, start again
          onStateChange: function (e) { if (e.data === 0) { try { e.target.playVideo(); } catch (_) {} } }
        }
      });
    } catch (e) {}
  };

  if (musicBtn) {
    musicBtn.addEventListener("click", function () {
      if (musicBtn.getAttribute("aria-pressed") === "true") musicStop();
      else musicPlay();
    });
  }

  // Best-effort: start the song softly on her first interaction (unless she opted out before).
  // Browsers block autoplay *with sound*, so this needs a real gesture to begin.
  (function () {
    function maybeStart(e) {
      if (e && e.target && e.target.closest && e.target.closest("#music-toggle")) return; // let the toggle handle itself
      document.removeEventListener("pointerdown", maybeStart, true);
      document.removeEventListener("keydown", maybeStart, true);
      if (safeStorage(function () { return localStorage.getItem(MUSIC_KEY); }) === "off") return;
      musicPlay();
    }
    document.addEventListener("pointerdown", maybeStart, true);
    document.addEventListener("keydown", maybeStart, true);
  })();

  /* ========================= Init ======================================== */
  buildSparkles();
  buildQuiz();
  buildMemes();
  updateDots();
})();
