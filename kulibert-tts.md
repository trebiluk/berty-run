# Kulibert text-to-speech

Paste this file into another bot. It matches Berty's Run (`src/game/access.ts`, live BR 1.9.10).

Use the browser only: `speechSynthesis`. No cloud voice, no API key, no microphone.

Speech is off until the student turns it on. A Read button still speaks the line in front of them, even when auto-read is off.

## What to store

Each app uses its own key. Berty's Run uses `br-access-v1`. Botz should use `bz-access-v1`, and so on. Do not share one key yet. Same shape:

```json
{ "lang": "en", "speak": false, "big": false, "fewer": false }
```

- `lang`: `en`, `simple`, or `es`
- `speak`: auto-read the next lesson or question
- `big`: bigger type
- `fewer`: show the right answer and one wrong one

After a write, set `document.documentElement.dataset.big` and `dataset.lang`, then fire a window event named `<app>-access` so the screen updates.

## The only speak functions

```javascript
function say(text, lang) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "es" ? "es-US" : "en-US";
  u.rate = lang === "simple" ? 0.85 : 0.95;
  window.speechSynthesis.speak(u);
}

function stopSay() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

var ACCESS_KEY = "xx-access-v1";

function readAccess() {
  try {
    var raw = JSON.parse(localStorage.getItem(ACCESS_KEY) || "{}");
    var lang = raw.lang === "simple" || raw.lang === "es" ? raw.lang : "en";
    return { lang: lang, speak: !!raw.speak, big: !!raw.big, fewer: !!raw.fewer };
  } catch (e) {
    return { lang: "en", speak: false, big: false, fewer: false };
  }
}

function writeAccess(next) {
  try {
    localStorage.setItem(ACCESS_KEY, JSON.stringify(next));
  } catch (e) {}
  document.documentElement.dataset.big = next.big ? "1" : "0";
  document.documentElement.dataset.lang = next.lang;
  window.dispatchEvent(new Event("xx-access"));
}
```

Rename `xx-access-v1` and `xx-access` to the app's short name before shipping.

Call `stopSay()` when the student leaves the card. Always `cancel()` before a new line so voices do not pile up.

The Settings click is the user gesture Chromebooks need. Do not speak on page load.

## What to speak

One or two short sentences, then the question, then the choices. Not the whole lesson.

Example: "Storage. Storage keeps files when the power is off. How is an SSD different from RAM? RAM is always bigger. An SSD keeps files when the power is off."

| Moment | Speak? |
|---|---|
| Student turns Read aloud on | Yes. "Read aloud is on." or "Lectura activada." |
| Student changes language | Yes. "English." / "Simple words." / "Español." |
| A question card opens and Read aloud is on | Yes. Title, one line, question, choices. |
| Student taps Read | Yes, that card only. |
| They pick an answer | No, unless you add one short "Yes" or "Try another answer." |
| Gameplay, scores, menus | No. |

## Settings gear

One gear. Inside it, fat targets (at least 44px):

1. Language: English, Simple, Español
2. Read aloud: On / Off
3. Big text: On / Off
4. Fewer answers: On / Off

Labels stay visible. Do not use a speaker icon alone. Simple and Español need their own short strings. If a line is missing, show English and do not speak the long English essay.

## Do not

- Do not ask for the microphone.
- Do not speak student names. Alias only, and only if that screen is already showing it.
- Do not add a new library.
- Do not auto-play speech for a whole class on one speaker. Each Chromebook speaks for its own student.

## Done when

A student can open Settings, turn Read aloud on, hear one short line in the language they picked, tap Read on a question, and leave the card with the voice stopped.
