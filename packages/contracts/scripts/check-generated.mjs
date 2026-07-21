import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateOutputs } from "./generate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const drifted = [];
for (const [name, expected] of await generateOutputs()) {
  let actual;
  try {
    actual = await readFile(join(root, "src/generated", name), "utf8");
  } catch {
    drifted.push(name);
    continue;
  }
  if (actual !== expected) drifted.push(name);
}
if (drifted.length > 0) {
  throw new Error(
    `generated contract drift: ${drifted.join(", ")}; run pnpm generate`,
  );
}
console.log("generated contract sources are deterministic and current");
