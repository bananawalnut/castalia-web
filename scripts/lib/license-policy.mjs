const allowed = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "CC0-1.0",
  "Unlicense",
  "BlueOak-1.0.0",
  "Unicode-DFS-2016",
  "Python-2.0",
  "Zlib",
]);
const denied =
  /(?:AGPL|SSPL|Commons Clause|BUSL|Elastic|PolyForm|source.available|non.commercial|no.derivatives|UNLICENSED|restrictive custom)/i;
const manual =
  /(?:GPL|LGPL|MPL-2\.0|EPL|CDDL|Artistic-2\.0|WTFPL|SEE LICENSE IN|\bAND\b|\bOR\b|\(|\))/i;
export function classifyLicense(value) {
  if (typeof value !== "string" || value.trim() === "") return "deny";
  const license = value.trim();
  if (allowed.has(license)) return "allow";
  if (denied.test(license)) return "deny";
  if (manual.test(license)) return "manual";
  return "manual";
}
