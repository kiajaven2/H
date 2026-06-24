# 🎈 عيد ميلاد سعيد يا حوراء — Hawraa's Birthday Site 🐹

A black-and-gold party website that unfolds in **three stages**:

1. **Stage 1 — a question** 🎉 (a multiple-choice quiz)
2. **Stage 2 — memes** 😹 (because she loves them)
3. **Stage 3 — birthday balloons** 🎈 — pop a balloon for a friend's message; some balloons
   play a **voice note** 🎙️ instead of text. Popped balloons stay popped.

It's Arabic-first (right-to-left), hamster-themed, and fully static — no server or database.

---

## ✏️ What you edit (all in plain files)

| Want to change… | Edit this file |
|------------------|----------------|
| The **question** (stage 1) | [`data/quiz.js`](data/quiz.js) |
| The **memes** (stage 2) | drop images in [`memes/`](memes/) + list them in [`data/memes.js`](data/memes.js) |
| The **balloon messages** (stage 3) | [`data/messages.js`](data/messages.js) |
| The **voice note** 🎙️ | drop your recording at `assets/audio/voice-note.mp3` |

Every file has Arabic + English instructions at the top. Edit, save, reload — done.

### The questions (stage 1)
Open [`data/quiz.js`](data/quiz.js). Each question is one block, and **every option has its
own reply**. Any answer moves to the next question:
```js
{
  q: "السؤال؟",
  options: [
    { label: "خيار ١", reply: "الرد عند اختياره" },
    { label: "خيار ٢", reply: "ردّ آخر" },
  ],
  correct: 0,   // index of the "right" answer (glows gold + confetti). null = no right answer.
},
```
`correct` is just for the gold/shake styling — the quiz advances no matter what she picks.
Add more blocks for more questions.

### The memes (stage 2)
1. Put images in the [`memes/`](memes/) folder (e.g. `memes/funny1.jpg`).
2. List each one in [`data/memes.js`](data/memes.js):
   ```js
   { src: "memes/funny1.jpg", caption: "تعليق صغير 😹" },
   ```
The included `placeholder-*.svg` tiles are just samples — replace them with your memes.

### The balloon messages (stage 3)
Open [`data/messages.js`](data/messages.js) and copy a block:
```js
{ name: "اسم الصديق", message: "رسالتك هنا", lang: "ar", color: "pink" },
```
`lang` is `"ar"` or `"en"` (sets text direction). `color` is optional
(`pink·mint·peach·lavender·yellow·sky`). Set `approved: false` to hide one temporarily.

### The voice note 🎙️
Add `voice:` to **any** message in [`data/messages.js`](data/messages.js) to make that balloon
play audio instead of (or alongside) text — it looks exactly like the other balloons:
```js
{ name: "اسم الصديق", voice: "assets/audio/voice-note.mp3", message: "اضغطي ▶ لتسمعي الرسالة 💛", lang: "ar" },
```
Record yourself and save the file as **`assets/audio/voice-note.mp3`** (an example entry is
already in the file). If the file isn't there yet, the balloon still works and shows a friendly
note instead. See [`assets/audio/README.txt`](assets/audio/README.txt).

---

## 👀 Preview it on your computer
- **Easiest:** double-click `index.html`.
- **Closer to the real thing:** run `python3 -m http.server` in this folder, open <http://localhost:8000>.

No installation or build step required.

---

## 🚀 Publish it free on GitHub Pages
1. Create a repo on GitHub (e.g. `hawraa-birthday`).
2. Upload all files (drag-and-drop in the web UI, or use git):
   ```bash
   git init
   git add .
   git commit -m "Hawraa's birthday site 🎈"
   git branch -M main
   git remote add origin https://github.com/<your-username>/hawraa-birthday.git
   git push -u origin main
   ```
3. **Settings → Pages**: Source = *Deploy from a branch*, Branch = `main` / `root`, Save.
4. ~1 minute later it's live at `https://<your-username>.github.io/hawraa-birthday/`. Share it 💛

The included `.nojekyll` makes GitHub Pages serve everything as-is.

---

## 🙋 Letting other friends add messages later
The data is structured so this needs **zero code changes**: collect messages with a free
**Google Form** (no account needed for friends), review them, then paste the good ones as new
blocks in [`data/messages.js`](data/messages.js) and re-publish. (A GitHub Issue-Form +
Action can automate this later.)

---

## 🛠️ What's in here
```
index.html         the page (3 stages)
styles.css         black + gold theme, stages, balloons, popup, starfield
app.js             stage flow + quiz + memes + balloons + voice playback
confetti.js        self-contained confetti (no external library)
data/quiz.js       ← stage 1 question(s)
data/memes.js      ← stage 2 meme list
data/messages.js   ← stage 3 balloon messages (text / image / voice) + closing note (window.FINALE)
memes/             ← your meme images
assets/images/     ← picture-message images
assets/audio/      ← voice-message audio files
```

Background music is a soft **"Happy Birthday" melody synthesized in the browser** (Web Audio API) —
no files, no YouTube (the melody is public domain). The 🎵 button toggles it; it starts on the first
tap (browsers require a gesture before playing sound) and works on **all devices, including iPhone**.
It quiets during voice notes, then resumes. Adjust loudness via `MUSIC_VOL` in app.js.

## 📋 Credits & licensing
- Fonts: **Baloo Bhaijaan 2**, **Tajawal**, **Cairo** — Google Fonts (Open Font License).
- Hamster: a hand-drawn inline SVG made for this site (nothing to attribute).
- Confetti & sparkles: hand-written, no external libraries.

Made with love. 💛🐹🎈
