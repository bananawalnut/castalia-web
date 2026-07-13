import { scanArtifacts } from "./lib/secret-scan.mjs";
const root = process.argv[2];
if (!root)
  throw new Error("usage: node scripts/scan-artifacts.mjs <directory>");
const findings = await scanArtifacts(root);
if (findings.length)
  throw new Error(
    `artifact secret scan failed:\n${findings.map((item) => `${item.file}: ${item.kind}`).join("\n")}`,
  );
console.log(`artifact secret scan passed: ${root}`);
