import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanArtifacts } from "./lib/secret-scan.mjs";
const gitleaks = spawnSync(
  "gitleaks",
  ["git", "--no-banner", "--redact", "--config", ".gitleaks.toml"],
  { stdio: "inherit" },
);
if (gitleaks.error?.code === "ENOENT")
  throw new Error("Gitleaks unavailable; secret gate fails closed");
if (gitleaks.status !== 0)
  throw new Error("Gitleaks reported findings or scanner failure");
const tracked = execFileSync("git", [
  "ls-files",
  "-z",
  "--cached",
  "--others",
  "--exclude-standard",
])
  .toString()
  .split("\0")
  .filter(Boolean);
for (const path of tracked) {
  if (
    /^(?:apps\/bff\/tests\/runtime\.test\.ts|tests\/policy-negative\.test\.mjs|pnpm-lock\.yaml)$/.test(
      path,
    )
  )
    continue;
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch {
    continue;
  }
  const temp = await mkdtemp(join(tmpdir(), "castalia-source-scan-"));
  await writeFile(join(temp, "source.js"), text);
  const findings = await scanArtifacts(temp);
  await rm(temp, { recursive: true });
  if (findings.length) throw new Error(`${path}: potential credential marker`);
}
console.log(
  `secret scan passed: ${tracked.length} tracked paths plus Gitleaks history scan`,
);
