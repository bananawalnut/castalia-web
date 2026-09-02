import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateAudit } from "../scripts/lib/dependency-policy.mjs";
import { classifyLicense } from "../scripts/lib/license-policy.mjs";
import { scanArtifacts } from "../scripts/lib/secret-scan.mjs";
import {
  STARTUP_PROBE_TIMEOUT_MS,
  waitForStartup,
} from "../scripts/lib/startup-policy.mjs";
import { validateWorkflowText } from "../scripts/lib/workflow-policy.mjs";

async function fixture() {
  return mkdtemp(join(tmpdir(), "castalia-policy-negative-"));
}

test("Pages generation materializes safe physical entries without hostname knowledge", async () => {
  const { generatePagesRouteEntries } =
    await import("../scripts/lib/pages-route-entries.mjs");
  const root = await fixture();
  const dist = join(root, "dist");
  const shell =
    '<!doctype html><script type="module" src="/dynamic-base/assets/app.js"></script>';
  await mkdir(dist);
  await writeFile(join(dist, "index.html"), shell);

  const result = await generatePagesRouteEntries({
    dist,
    routes: ["/", "/start", "/rfcs/rfc-0017", "/tenders/tnd-0001"],
  });

  assert.deepEqual(result.routes, [
    "/",
    "/rfcs/rfc-0017",
    "/start",
    "/tenders/tnd-0001",
  ]);
  for (const route of result.routes.filter((route) => route !== "/")) {
    assert.equal(
      await readFile(join(dist, route.slice(1), "index.html"), "utf8"),
      shell,
    );
  }
  assert.equal(await readFile(join(dist, "404.html"), "utf8"), shell);
  assert.equal(await readFile(join(dist, ".nojekyll"), "utf8"), "");
  assert.doesNotMatch(shell, /bananawalnut\.github\.io/);
  await assert.rejects(
    generatePagesRouteEntries({ dist, routes: ["/../escape"] }),
    /unsafe route/i,
  );

  const workflow = await readFile(
    new URL("../.github/workflows/pages.yml", import.meta.url),
    "utf8",
  );
  assert.match(
    workflow,
    /pnpm exec tsx scripts\/generate-pages-route-entries\.ts/,
  );
  assert.doesNotMatch(workflow, /cp apps\/web\/dist\/index\.html/);
  const packageManifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(packageManifest.devDependencies.tsx, "4.21.0");
});

test("workspace overrides pin patched high-severity transitive dependencies", async () => {
  const workspace = await readFile(
    new URL("../pnpm-workspace.yaml", import.meta.url),
    "utf8",
  );
  assert.match(workspace, /^  js-yaml: 4\.3\.1$/m);
  assert.match(workspace, /^  nanoid: 3\.3\.18$/m);
  assert.match(workspace, /^  esbuild: 0\.28\.1$/m);
  assert.match(workspace, /^  - esbuild@0\.28\.1$/m);
  assert.match(workspace, /^  - nanoid@3\.3\.18$/m);
});

test("standalone browser and budget gates build the wallet WASM prerequisite", async () => {
  for (const script of ["run-browser.mjs", "check-build-budgets.mjs"]) {
    const source = await readFile(
      new URL(`../scripts/${script}`, import.meta.url),
      "utf8",
    );
    assert.match(source, /"@castalia\/web",\s*"wasm:build"/);
  }
});

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

test("startup policy fails a cold launch that exceeds two seconds", async () => {
  let elapsed = 0;
  const ready = await waitForStartup({
    probe: async () => false,
    now: () => elapsed,
    sleep: async (milliseconds) => {
      elapsed += milliseconds;
    },
  });

  assert.equal(STARTUP_PROBE_TIMEOUT_MS, 2_000);
  assert.equal(ready, false);
  assert.equal(elapsed, 2_000);
});

test("startup policy bounds a hanging health probe", async () => {
  const started = performance.now();
  const ready = await waitForStartup({
    probe: async () => new Promise(() => {}),
    timeout: 25,
  });

  const elapsed = performance.now() - started;
  assert.equal(ready, false);
  assert.ok(elapsed >= 20);
  assert.ok(elapsed < 250);
}, 500);
