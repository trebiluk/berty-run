import assert from "node:assert/strict";
import test from "node:test";
import { WHATS_NEW_LANG } from "./techworks.ts";

function renderScript() {
  return `(function(){var W=${JSON.stringify(WHATS_NEW_LANG)};function lang(){return 'en';}function set(){}function paint(){}set();})();`;
}

test("What's new script evaluates without SyntaxError for every language", () => {
  const script = renderScript();
  assert.doesNotThrow(() => {
    new Function(script)();
  });
  // specifically check rw which has apostrophe
  const rw = WHATS_NEW_LANG.rw;
  assert.ok(rw.includes("'") || rw.includes("’"), "rw should contain an apostrophe");
  assert.ok(script.includes(JSON.stringify(rw)), "script contains properly escaped rw");
});
