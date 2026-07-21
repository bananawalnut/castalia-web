import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { classifyLicense } from "./lib/license-policy.mjs";

const command = spawnSync("pnpm", ["licenses", "list", "--json"], {
  encoding: "utf8",
});
if (command.status !== 0 || !command.stdout)
  throw new Error(
    `license scanner unavailable: ${command.stderr || "no output"}`,
  );
const report = JSON.parse(command.stdout);
const reviews = JSON.parse(
  await readFile(
    new URL("../security/license-reviews.json", import.meta.url),
    "utf8",
  ),
);
const entries = (
  Array.isArray(report)
    ? report
    : Object.entries(report).flatMap(([license, packages]) =>
        (packages ?? []).map((item) => ({
          ...item,
          license: item.license ?? license,
        })),
      )
).flatMap((item) => {
  const versions = Array.isArray(item.versions)
    ? item.versions
    : [item.version ?? "unknown-version"];
  return versions.map((version) => ({ ...item, version }));
});
const failures = [];
for (const entry of entries) {
  const name = entry.name ?? entry.package ?? "unknown-package";
  const version = entry.version ?? "unknown-version";
  const license = entry.license ?? entry.licenses;
  const disposition = classifyLicense(license);
  if (disposition === "deny")
    failures.push(`${name}@${version}: denied license ${String(license)}`);
  if (disposition === "manual") {
    const review = reviews.find(
      (item) =>
        item.package === name &&
        item.version === version &&
        item.license === license &&
        /^https:\/\//.test(item.url ?? ""),
    );
    if (!review)
      failures.push(
        `${name}@${version}: manual review missing for ${String(license)}`,
      );
  }
}
if (failures.length)
  throw new Error(`license policy failed:\n${failures.join("\n")}`);
console.log(`license policy passed: ${entries.length} package records`);
