const store = new Map();
const nodes = new Map();
const ctx = new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === "canvas") return null;
      return () => ctx;
    },
  },
);
function mockCanvas() {
  return {
    width: 64,
    height: 64,
    style: {},
    clientWidth: 800,
    clientHeight: 600,
    addEventListener() {},
    removeEventListener() {},
    getContext() {
      return ctx;
    },
    getBoundingClientRect() {
      return { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600 };
    },
  };
}
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.devicePixelRatio = 1;
globalThis.localStorage = {
  getItem(k) {
    return store.has(k) ? store.get(k) : null;
  },
  setItem(k, v) {
    store.set(k, String(v));
  },
  removeItem(k) {
    store.delete(k);
  },
};
globalThis.document = {
  hidden: false,
  addEventListener() {},
  removeEventListener() {},
  createElement() {
    const el = {
      _id: "",
      textContent: "",
      parentElement: null,
      style: {},
      width: 64,
      height: 64,
      getContext() {
        return ctx;
      },
    };
    Object.defineProperty(el, "id", {
      get() {
        return el._id;
      },
      set(v) {
        el._id = v;
        nodes.set(v, el);
      },
    });
    return el;
  },
  getElementById(id) {
    return nodes.get(id) ?? null;
  },
  body: {
    appendChild(el) {
      el.parentElement = globalThis.document.body;
    },
  },
};
globalThis.performance = globalThis.performance ?? { now: () => Date.now() };
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
globalThis.AudioContext = class {
  constructor() {
    this.state = "running";
    this.currentTime = 0;
    this.destination = {};
  }
  createGain() {
    return { gain: { value: 1, setTargetAtTime() {} }, connect() {} };
  }
  createOscillator() {
    return { type: "sine", frequency: { value: 440 }, connect() {}, start() {}, stop() {} };
  }
  resume() {
    return Promise.resolve();
  }
};

const { Bend3D } = await import("../src/game/bend3d.ts");
const orig = Bend3D.prototype.load;
Bend3D.prototype.load = function (id) {
  return orig.call(this, id, true);
};

const { Engine } = await import("../src/game/engine.ts");
const { runClearBot } = await import("../src/game/clear-bot.ts");

const canvas = mockCanvas();
const canvas3d = mockCanvas();
const eng = new Engine(canvas, canvas3d, () => {});
const rows = await runClearBot(eng);
const pre = document.getElementById("bot-report");
console.log("---TABLE---");
console.log(pre?.textContent ?? "");
const fails = rows.filter((r) => r.result !== "clear");
process.exit(fails.length ? 1 : 0);
