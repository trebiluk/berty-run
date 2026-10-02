import { runRespawnSelftest } from "../src/game/selftest.ts";

const report = runRespawnSelftest();
let fails = 0;
for (const line of report.lines) {
  if (!line.ok) fails += 1;
  console.log(`${line.ok ? "PASS" : "FAIL"}  ${line.name}  ${line.detail}`);
}
console.log(report.ok ? `SELFTEST PASS ${report.lines.length}` : `SELFTEST FAIL ${fails}`);
process.exit(report.ok ? 0 : 1);
