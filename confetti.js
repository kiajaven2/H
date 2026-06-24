/* ============================================================================
   confetti.js — tiny, self-contained canvas confetti. No dependencies, no CDN.
   Exposes window.popConfetti(x, y) — bursts particles from a screen point.
   Draws to a single <canvas id="confetti-canvas">, so it stays cheap on mobile.
   ============================================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("confetti-canvas");
  if (!canvas || !canvas.getContext) {
    window.popConfetti = function () {}; // no-op fallback
    return;
  }

  var ctx = canvas.getContext("2d");
  var particles = [];
  var rafId = null;
  var w = 0, h = 0;

  function resize() {
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  var COLORS = ["#ff6b9d", "#ffd166", "#8ce0c4", "#b39ddb", "#ffb58a", "#7ec8e3", "#ffffff"];

  function rand(min, max) {
    // deterministic-free randomness is fine here (cosmetic only)
    return min + Math.random() * (max - min);
  }

  function burst(x, y) {
    var count = 90;
    for (var i = 0; i < count; i++) {
      var angle = rand(0, Math.PI * 2);
      var speed = rand(4, 11);
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(3, 6), // bias the burst upward
        size: rand(5, 11),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: rand(0, Math.PI),
        vr: rand(-0.18, 0.18),
        life: 0,
        ttl: rand(80, 140),
        round: Math.random() < 0.45
      });
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    var gravity = 0.18;
    var drag = 0.992;

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;

      var alpha = 1 - p.life / p.ttl;
      if (alpha <= 0 || p.y - p.size > h + 40) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      ctx.restore();
    }

    if (particles.length) {
      rafId = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
      rafId = null;
    }
  }

  window.popConfetti = burst;
})();
