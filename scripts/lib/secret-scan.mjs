import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
const extensions = new Set([
  ".js",
  ".css",
  ".html",
  ".json",
  ".map",
  ".yaml",
  ".yml",
  ".ts",
  ".tsx",
  ".md",
]);
const patterns = [
  ["aws-access-key", /AKIA[0-9A-Z]{16}/g],
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["github-token", /gh[pousr]_[A-Za-z0-9_]{30,}/g],
  [
    "generic-credential",
    /(?:password|secret|access[_-]?token|private[_-]?key)\s*[:=]\s*["'][^"'\s]{8,}["']/gi,
  ],
  ["castalia-canary", /CASTALIA_(?:SECRET|TOKEN)_CANARY_[A-Z0-9]{8,}/g],
];
async function files(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) output.push(...(await files(path)));
    else if (
      extensions.has(extname(entry.name)) ||
      entry.name === "manifest.webmanifest"
    )
      output.push(path);
  }
  return output;
}
export async function scanArtifacts(root) {
  const findings = [];
  for (const path of await files(root)) {
    const text = await readFile(path, "utf8");
    for (const [kind, pattern] of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text))
        findings.push({ file: relative(root, path), kind });
    }
  }
  return findings;
}
