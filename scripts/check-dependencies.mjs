import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { evaluateAudit } from "./lib/dependency-policy.mjs";

const reportPath = process.env.CASTALIA_AUDIT_REPORT;
const reportText = reportPath
  ? await readFile(reportPath, "utf8")
  : (() => {
      const audit = spawnSync("pnpm", ["audit", "--json"], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
      if (audit.error || !audit.stdout) {
        throw new Error(
          `dependency scanner unavailable: ${audit.error?.message ?? audit.stderr ?? "no output"}`,
        );
      }
      return audit.stdout;
    })();
let report;
try {
  report = JSON.parse(reportText);
} catch {
  throw new Error("dependency scanner returned malformed JSON");
}
const exceptions = JSON.parse(
  await readFile(
    new URL("../security/dependency-exceptions.json", import.meta.url),
    "utf8",
  ),
);
const summary = evaluateAudit(report, exceptions);
console.log(
  `dependency policy passed: moderate=${summary.moderate} high=${summary.high} critical=${summary.critical}`,
);
