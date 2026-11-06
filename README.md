# Captain Leap's Word Quest 🦸

A reading and speaking app for 5-year-olds. It runs entirely in the browser: nothing to install, no accounts, and progress is saved on this device.

## Run it
1. Double-click **`start.bat`**. It needs Python, and opens http://localhost:8080.
2. Use **Google Chrome or Microsoft Edge**, which can listen to speech. Click **Allow** when the browser asks for the microphone.
3. A grown-up types the child's name, and you're ready.

> If the page is opened straight from the file (`file://`), the microphone may not work. Use `start.bat`.

## Install it as a home-screen app
Open the app's web address (your GitHub Pages link) on the device, then:

| Device | Browser | How to install | Listening to speech |
|---|---|---|---|
| **Android phone/tablet** | Chrome | Menu ⋮ → **Install app** (or ⚙️ Grown-ups → 📲 Install) | ✅ works |
| **iPhone / iPad** | Safari | **Share** ⬆️ → **Add to Home Screen** | ⚠️ usually works in Safari, can be unreliable once installed. Grown-up buttons are the backup |
| **Amazon Fire tablet** | Silk | Menu ☰ → **Add to Home** | ❌ Silk can't listen. Use the grown-up buttons (✅ Got it / 🙂 Partly / 🔁 Not yet) |
| **Windows / Mac** | Edge or Chrome | Install icon in the address bar | ✅ works (Edge has the child voice "Ana") |

- After the first visit, the app works **offline**. Checking the child's speech still needs internet.
- Progress is saved separately on each device.
- **Publishing changes:** bump `VERSION` in `sw.js` (for example `wq-v2`), then commit and push. Devices pick up the update the next time the app is opened twice.

## What's inside
**Reading (synthetic phonics)**, 10 levels: short a/e/i/o/u → sh/ch/th/ck → blends → magic e → vowel teams → bossy r.
Each word goes through three steps:
- 👀 **Look**: slide a finger or mouse under the letters. Each one plays its *sound* ("c-a-t" → "kuh-ah-tuh"), then *Sound it out* blends them into the word.
- 🎤 **Say**: the child reads the word aloud. The app listens and checks the pronunciation.
- 🧩 **Build**: tap letter tiles in order to spell the word.

**Speaking (speech-therapy techniques)**:
- 📸 **Picture Talk (Colourful Semantics)**: Who? / Doing? / What? / Where? colour blocks build a sentence step by step. The child answers by speaking or tapping a picture, then says the whole sentence.
- 🧱 **Sentence frames with fading prompts**: "I see a ___". The first one is modelled, then the child tries on their own.
- 💬 **Chat with Ollie the Owl (expansion & recasting)**: short answers like "dog" are modelled back as full sentences ("My favorite animal is the dog") for the child to repeat.
- 📚 **Story sequencing**: put First / Next / Last pictures in order, then retell the story.

**Daily routine**: one lesson per subject per day. A lesson is 10 words, or up to 20 minutes, followed by a quiz that listens to the child's speech.
A quiz score of 50% or more makes Captain Leap jump to the next building on the map, with a sticker as a reward. Every finished lesson earns a star, and the app tracks a daily streak.

**Grown-ups (⚙️ on the home screen)**: change the voice and speed, test the microphone, set levels, unlock an extra lesson, and see progress history with the words to practise.

## Phonics sounds
Letter sounds are real audio clips in `audio/phonics/`. They're generated from IPA phonetic symbols (US English) by Windows' built-in speech engine. They aren't spelled-out text, which a voice would read as letter names ("en-en-en").
- Continuous sounds (m, n, s, f, l, r, v, z, sh, th, ng, and the vowels) are stretched to about half a second, so they can be held and blended: /mmm/, /sss/.
- Stop sounds (b, c/k, d, g, p, t) are clipped, with no added "uh": /t/, not "tuh".
- To change a sound, edit its IPA in `tools/phonemes.json`, then rebuild the clips:
  `powershell -ExecutionPolicy Bypass -File tools\make-phonics.ps1`
- You can also record your own voice: save a clip such as `audio/phonics/t.wav` over the generated one, and the app will use it.

## Files
- `index.html`: page shell
- `css/style.css`: styling
- `js/data.js`: curriculum (words, phonics sounds, scenes, frames, conversations, stories). Edit it to add content.
- `js/speech.js`: text-to-speech, phonics sounds, speech recognition and scoring
- `js/app.js`: screens, lessons, quizzes, map, and rewards

## Notes
- Speech recognition in Chrome and Edge runs on the browser maker's online service, so it needs an internet connection.
- The speech engine is tuned for adults, so it's fairly forgiving of a child's speech. A grown-up nearby helps.
- In browsers that can't listen to speech, the app shows **grown-up buttons** (✅ Got it / 🙂 Partly / 🔁 Not yet) instead.
