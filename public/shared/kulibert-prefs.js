/* One settings bag for every Tech Room app. No names. No libraries.
   App themes stay in each app. This file sets colors only when data-kp-contrast is 1.
   Sound can be off for one app without muting the others. */
(function (root) {
  var KEY = "kulibert-prefs-v1";
  var APPKEY = "kulibert-prefs-app-v1";
  var SCALE = { S: ".9", M: "1", L: "1.25", XL: "1.5" };
  var BRIDGE = ["sc-access-v1", "sl-access-v1", "br-access-v1", "ti-access-v1", "bz-access-v1", "kz-access-v1"];
  var fans = [];
  var gains = [];
  var cssOn = false;
  var firedLang = "";
  var LANG_OK = { en: 1, simple: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };
  var VOICE = { en: "en-US", simple: "en-US", uk: "uk-UA", ru: "ru-RU", es: "es-US", ar: "ar", "fa-AF": "fa" };

  function langOf(value) {
    var s = String(value || "");
    return LANG_OK[s] ? s : "en";
  }
  function dirOf(lang) {
    return lang === "ar" || lang === "fa-AF" ? "rtl" : "ltr";
  }
  function htmlLang(lang) {
    return lang === "simple" ? "en" : (lang || "en");
  }
  function withDir(p) {
    p.dir = dirOf(p.lang);
    return p;
  }

  function classic() {
    try {
      if (new URLSearchParams(location.search).get("hub") === "classic") return true;
      if (new URLSearchParams(location.search).get("theme") === "classic") return true;
      if (localStorage.getItem("tech-room-hub") === "classic") return true;
    } catch (e) {}
    return false;
  }
  function onHub() {
    var path = (location.pathname || "/").replace(/\/+$/, "") || "/";
    return path === "/" || path === "/index.html";
  }
  function appId() {
    if (onHub()) return "";
    var node = document.querySelector("script[src*='kulibert-bar.js'][data-app]") || document.querySelector("script[data-app]");
    var fromTag = node && node.getAttribute("data-app");
    if (fromTag) return fromTag;
    var bit = (location.pathname || "").split("/").filter(Boolean)[0] || "";
    if (bit === "music") return "musiclab";
    return bit;
  }
  function blank() {
    var less = false;
    try { less = root.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    return { v: 1, size: "M", contrast: false, motion: less ? "less" : "full", sound: true, captions: true, read: false, lang: "en" };
  }
  function tidy(raw) {
    var p = blank();
    if (!raw || typeof raw !== "object") return p;
    if (raw.size === "S" || raw.size === "L" || raw.size === "XL" || raw.size === "M") p.size = raw.size;
    p.contrast = !!raw.contrast;
    p.motion = raw.motion === "less" ? "less" : "full";
    p.sound = raw.sound !== false;
    p.captions = raw.captions !== false;
    p.read = !!raw.read;
    p.lang = langOf(raw.lang);
    p.v = 1;
    return p;
  }
  function fromCode(text) {
    var b = String(text || "").split(".");
    if (b.length < 7) return null;
    return tidy({ size: b[0], contrast: b[1] === "1", motion: b[2] === "1" ? "less" : "full", sound: b[3] !== "0", captions: b[4] !== "0", read: b[5] === "1", lang: b[6] });
  }
  function codeOf(p) {
    return [p.size, p.contrast ? 1 : 0, p.motion === "less" ? 1 : 0, p.sound ? 1 : 0, p.captions ? 1 : 0, p.read ? 1 : 0, p.lang].join(".");
  }
  function stored() {
    try { return tidy(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { return blank(); }
  }
  function readApps() {
    try {
      var raw = JSON.parse(localStorage.getItem(APPKEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (e) { return {}; }
  }
  function writeApps(apps) {
    try { localStorage.setItem(APPKEY, JSON.stringify(apps)); } catch (e) {}
  }
  function soundOn() {
    if (classic()) return true;
    var id = appId();
    if (id) {
      var row = readApps()[id];
      if (row && typeof row.sound === "boolean") return row.sound;
    }
    return stored().sound !== false;
  }
  function get() {
    if (classic()) return withDir(blank());
    var p = stored();
    try {
      var m = (location.hash || "").match(/(?:^#|&)kp=([^&]+)/);
      if (m) {
        var next = fromCode(decodeURIComponent(m[1]));
        if (next) { p = next; write(p); }
      }
    } catch (e2) {}
    p.sound = soundOn();
    return withDir(p);
  }
  function write(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }
  function bridge(p) {
    var shape = JSON.stringify({ lang: p.lang, speak: !!p.read, big: p.size === "L" || p.size === "XL", fewer: p.motion === "less", kp: 1 });
    BRIDGE.forEach(function (key) {
      try {
        var cur = localStorage.getItem(key);
        if (cur && cur !== "{}" && cur.indexOf('"kp":1') < 0 && cur.indexOf('"kp": 1') < 0) return;
        localStorage.setItem(key, shape);
      } catch (e) {}
    });
  }
  function css() {
    if (cssOn || !document.head) return;
    cssOn = true;
    var node = document.createElement("style");
    node.id = "kp-style";
    /* App colors and fonts stay in the app. Only high contrast paints the page. */
    node.textContent = [
      "html[data-kp-motion=less],html[data-kp-motion=less] *{animation:none !important;transition:none !important;scroll-behavior:auto !important}",
      "html[data-kp-contrast='1'] body{background:#000 !important;color:#fff !important}",
      "html[data-kp-contrast='1'] button,html[data-kp-contrast='1'] a,html[data-kp-contrast='1'] input{background:#000 !important;color:#ffe14a !important;border-color:#ffe14a !important}",
      "#kp-live{position:fixed;left:8px;bottom:8px;z-index:80;max-width:min(28rem,92vw);padding:.35rem .7rem;border-radius:10px;background:#000;color:#ffe14a;font:650 14px/1.5 var(--kp-font),Outfit,\"Noto Sans\",\"Noto Sans Arabic\",\"Noto Sans Ethiopic\",system-ui,sans-serif}",
      "#kp-live[hidden]{display:none !important}",
      ":focus-visible{outline:3px solid #ffe14a;outline-offset:2px}"
    ].join("");
    document.head.appendChild(node);
  }
  function clearAttrs() {
    var el = document.documentElement;
    ["data-kp-size", "data-kp-contrast", "data-kp-motion", "data-kp-sound", "data-kp-lang", "data-kp-read", "data-kp-captions"].forEach(function (name) { el.removeAttribute(name); });
    el.style.removeProperty("--kp-scale");
  }
  function syncGains() {
    var vol = soundOn() ? 1 : 0;
    gains.forEach(function (node) {
      try { node.gain.setValueAtTime(vol, node.context.currentTime || 0); } catch (e) {}
    });
  }
  function apply(p) {
    if (classic()) { clearAttrs(); return; }
    css();
    var el = document.documentElement;
    el.setAttribute("data-kp-size", p.size);
    el.setAttribute("data-kp-contrast", p.contrast ? "1" : "0");
    el.setAttribute("data-kp-motion", p.motion === "less" ? "less" : "full");
    el.setAttribute("data-kp-sound", soundOn() ? "1" : "0");
    el.setAttribute("data-kp-lang", p.lang);
    el.lang = htmlLang(p.lang);
    el.setAttribute("data-kp-read", p.read ? "1" : "0");
    el.setAttribute("data-kp-captions", p.captions ? "1" : "0");
    el.style.setProperty("--kp-scale", SCALE[p.size] || "1");
    bridge(p);
    armMute();
    syncGains();
  }
  function tell(p) {
    fans.forEach(function (fn) { try { fn(p); } catch (e) {} });
  }
  function live() {
    var node = document.getElementById("kp-live");
    if (node) return node;
    node = document.createElement("p");
    node.id = "kp-live";
    node.setAttribute("role", "status");
    node.hidden = true;
    (document.body || document.documentElement).appendChild(node);
    return node;
  }
  function tr(key) {
    var api = root.KulibertI18n;
    if (!api || !api.t) return "";
    try { return api.t(key) || ""; } catch (e) { return ""; }
  }
  function matchVoice(tag, voices) {
    if (!tag) return null;
    var want = String(tag).toLowerCase();
    var primary = want.split("-")[0];
    var exact = null;
    var same = null;
    for (var i = 0; i < voices.length; i++) {
      var vl = String(voices[i].lang || "").toLowerCase().replace(/_/g, "-");
      if (vl === want) exact = voices[i];
      else if (vl === primary || vl.indexOf(primary + "-") === 0) same = same || voices[i];
    }
    return exact || same || null;
  }
  function voiceFor(lang, voices) {
    var code = langOf(lang == null ? get().lang : lang);
    var tag = VOICE[code] || "";
    if (!tag) return null;
    var list = voices;
    if (!list) {
      try { list = root.speechSynthesis && root.speechSynthesis.getVoices ? root.speechSynthesis.getVoices() : []; } catch (e) { list = []; }
    }
    return matchVoice(tag, list || []);
  }
  function withVoices(cb) {
    var synth = root.speechSynthesis;
    if (!synth || !synth.getVoices) { cb([]); return; }
    var list = [];
    try { list = synth.getVoices() || []; } catch (e) { list = []; }
    if (list.length) { cb(list); return; }
    var timer = setTimeout(function () {
      try { synth.removeEventListener("voiceschanged", onv); } catch (e2) {}
      try { cb(synth.getVoices() || []); } catch (e3) { cb([]); }
    }, 600);
    function onv() {
      clearTimeout(timer);
      try { synth.removeEventListener("voiceschanged", onv); } catch (e4) {}
      try { cb(synth.getVoices() || []); } catch (e5) { cb([]); }
    }
    try { synth.addEventListener("voiceschanged", onv); } catch (e6) { clearTimeout(timer); cb([]); }
  }
  function noVoiceLine() {
    return tr("noVoice") || "No voice yet. Read the words.";
  }
  function say(text) {
    var words = String(text || "").replace(/\s+/g, " ").trim().slice(0, 180);
    if (!words || classic()) return;
    var p = get();
    var line = live();
    line.hidden = false;
    line.lang = htmlLang(p.lang);
    line.dir = dirOf(p.lang);
    line.textContent = words;
    if (!soundOn()) return;
    withVoices(function (voices) {
      var voice = voiceFor(p.lang, voices);
      if (!voice || !root.speechSynthesis) {
        line.textContent = words + " " + noVoiceLine();
        return;
      }
      if (!p.read) return;
      try {
        root.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(words);
        u.voice = voice;
        u.lang = voice.lang || VOICE[p.lang] || "en-US";
        root.speechSynthesis.speak(u);
      } catch (e) {
        line.textContent = words + " " + noVoiceLine();
      }
    });
  }
  function cue(kind) {
    if (classic()) return;
    var raw = String(kind || "");
    var key = raw === "fail" ? "retry" : raw === "pass" ? "" : raw;
    var words = (key && tr(key)) || raw || tr("next") || "Done";
    var line = live();
    line.hidden = false;
    line.textContent = words;
  }
  function armMute() {
    if (root.__kpMute) return;
    root.__kpMute = 1;
    var play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!soundOn()) { try { this.pause(); } catch (e) {} return Promise.resolve(); }
      return play.apply(this, arguments);
    };
    ["AudioContext", "webkitAudioContext"].forEach(function (name) {
      var Native = root[name];
      if (!Native) return;
      var Wrapped = function () {
        var ctx = new (Function.prototype.bind.apply(Native, [null].concat([].slice.call(arguments))))();
        try {
          var gain = ctx.createGain();
          var dest = ctx.destination;
          gain.connect(dest);
          gains.push(gain);
          try { gain.gain.setValueAtTime(soundOn() ? 1 : 0, ctx.currentTime || 0); } catch (e0) {}
          Object.defineProperty(ctx, "destination", { configurable: true, get: function () {
            try { gain.gain.setValueAtTime(soundOn() ? 1 : 0, ctx.currentTime || 0); } catch (e1) {}
            return gain;
          } });
        } catch (e) {}
        return ctx;
      };
      Wrapped.prototype = Native.prototype;
      root[name] = Wrapped;
    });
  }
  function whoOk() {
    var who = root.KulibertWho && root.KulibertWho.read && root.KulibertWho.read();
    return who && who.verified && root.KulibertWho.active && root.KulibertWho.active() ? who : null;
  }
  function pushRemote(p, app) {
    var who = whoOk();
    if (!who) return;
    var body = { code: who.code, prefs: p };
    if (app) body.app = app;
    fetch("https://tw.kulibert.net/api/prefs", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }).catch(function () {});
  }
  function pullRemote() {
    var who = whoOk();
    if (!who) return;
    var id = onHub() ? "" : appId();
    var url = "https://tw.kulibert.net/api/prefs?code=" + encodeURIComponent(who.code);
    if (id) url += "&app=" + encodeURIComponent(id);
    fetch(url).then(function (res) {
      if (!res.ok) return null;
      return res.json();
    }).then(function (pack) {
      if (!pack) return;
      if (id) {
        var sound = null;
        if (pack.prefs && typeof pack.prefs.sound === "boolean") sound = pack.prefs.sound;
        else if (typeof pack.sound === "boolean") sound = pack.sound;
        if (sound === null) return;
        var apps = readApps();
        apps[id] = Object.assign({}, apps[id] || {}, { sound: sound });
        writeApps(apps);
        apply(stored());
        tell(get());
        return;
      }
      if (pack.app || !pack.prefs) return;
      var p = tidy(pack.prefs);
      write(p);
      apply(p);
      tell(p);
    }).catch(function () {});
  }
  function announce(prev) {
    var out = get();
    tell(out);
    if (out.lang !== prev) {
      firedLang = out.lang;
      try {
        root.dispatchEvent(new CustomEvent("kulibert-lang", { detail: { lang: out.lang, dir: out.dir } }));
      } catch (e) {}
    }
    return out;
  }
  function acceptLang(lang) {
    if (classic()) return get();
    var prev = stored().lang;
    var p = tidy(Object.assign(stored(), { lang: langOf(lang) }));
    write(p);
    apply(p);
    return announce(prev);
  }
  function set(partial) {
    if (classic()) return get();
    partial = Object.assign({}, partial || {});
    if (!onHub() && typeof partial.sound === "boolean") {
      setApp({ sound: partial.sound });
      delete partial.sound;
    }
    if (!onHub()) return get();
    var prev = stored().lang;
    var p = tidy(Object.assign(stored(), partial));
    write(p);
    apply(p);
    pushRemote(p);
    return announce(prev);
  }
  function setApp(partial) {
    if (classic()) return get();
    var id = appId();
    if (!id || !partial) return get();
    var apps = readApps();
    var row = Object.assign({}, apps[id] || {});
    if (typeof partial.sound === "boolean") row.sound = partial.sound;
    apps[id] = row;
    writeApps(apps);
    apply(stored());
    tell(get());
    if (typeof row.sound === "boolean") pushRemote({ sound: row.sound }, id);
    return get();
  }
  function on(fn) { if (typeof fn === "function") fans.push(fn); }
  root.addEventListener("storage", function (ev) {
    if (!ev || (ev.key !== KEY && ev.key !== APPKEY)) return;
    if (classic()) return;
    var prev = firedLang;
    apply(stored());
    announce(prev);
  });
  root.KulibertPrefs = {
    get: get,
    set: set,
    setApp: setApp,
    on: on,
    say: say,
    cue: cue,
    acceptLang: acceptLang,
    voiceFor: voiceFor,
    code: function () { return codeOf(stored()); }
  };
  try {
    Object.defineProperty(root.KulibertPrefs, "lang", { get: function () { return get().lang; } });
    Object.defineProperty(root.KulibertPrefs, "dir", { get: function () { return get().dir; } });
  } catch (eProp) {}
  if (!classic()) {
    apply(get());
    firedLang = stored().lang;
    pullRemote();
    if (root.MutationObserver) {
      new MutationObserver(function () {
        var p = stored();
        if (document.documentElement.getAttribute("data-kp-size") !== p.size) apply(p);
      }).observe(document.documentElement, { attributes: true });
    }
    document.addEventListener("DOMContentLoaded", function () { apply(stored()); });
  } else {
    clearAttrs();
    BRIDGE.forEach(function (key) {
      try {
        var cur = localStorage.getItem(key);
        if (cur && cur.indexOf('"kp":1') >= 0) localStorage.removeItem(key);
      } catch (e) {}
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
