import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateAudit } from "../scripts/lib/dependency-policy.mjs";
import { classifyLicense } from "../scripts/lib/license-policy.mjs";
import { scanArtifacts } from "../scripts/lib/secret-scan.mjs";
import { startupProbeTimeout } from "../scripts/lib/startup-policy.mjs";
import { validateWorkflowText } from "../scripts/lib/workflow-policy.mjs";

async function fixture() {
  return mkdtemp(join(tmpdir(), "castalia-policy-negative-"));
}

test("dependency policy rejects high, unexcepted moderate, expired exception, and scanner failure", () => {
  assert.throws(
    () =>
      evaluateAudit(
        {
          metadata: { vulnerabilities: { high: 1, critical: 0, moderate: 0 } },
        },
        [],
      ),
    /high|critical/i,
  );
  assert.throws(
    () =>
      evaluateAudit(
        {
          metadata: { vulnerabilities: { high: 0, critical: 0, moderate: 1 } },
        },
        [],
      ),
    /moderate/i,
  );
  assert.throws(
    () =>
      evaluateAudit(
        {
          metadata: { vulnerabilities: { high: 0, critical: 0, moderate: 1 } },
          advisories: { x: { severity: "moderate" } },
        },
        [
          {
            advisory: "x",
            url: "https://example.invalid/review",
            expires: "2000-01-01",
          },
        ],
      ),
    /expired/i,
  );
  assert.throws(() => evaluateAudit({}, []), /malformed|unavailable/i);
});

test("license policy has exact allow, deny, and manual-review behavior", () => {
  assert.equal(classifyLicense("MIT"), "allow");
  assert.equal(classifyLicense("AGPL-3.0-only"), "deny");
  assert.equal(classifyLicense("MPL-2.0"), "manual");
  assert.equal(classifyLicense("SEE LICENSE IN LICENSE.txt"), "manual");
  assert.equal(classifyLicense(undefined), "deny");
});

test("artifact scanner rejects an injected credential canary", async () => {
  const root = await fixture();
  await mkdir(join(root, "assets"));
  await writeFile(
    join(root, "assets", "app.js"),
    "const marker='CASTALIA_SECRET_CANARY_ABCDEFGH';",
  );
  const findings = await scanArtifacts(root);
  assert.ok(findings.some((finding) => finding.file.endsWith("app.js")));
});

test("workflow policy rejects unpinned actions, unsafe checkout, target events, and unbounded jobs", () => {
  const bad = `name: Bad\non: pull_request_target\npermissions: write-all\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n`;
  const errors = validateWorkflowText(bad, "bad.yml");
  assert.ok(errors.some((error) => error.includes("pull_request_target")));
  assert.ok(errors.some((error) => error.includes("40-character")));
  assert.ok(errors.some((error) => error.includes("persist-credentials")));
  assert.ok(errors.some((error) => error.includes("timeout")));
});

test("startup policy keeps cold-cache warm-up outside measured latency budgets", () => {
  assert.equal(startupProbeTimeout(true), 30_000);
  assert.equal(startupProbeTimeout(false), 2_000);
});
