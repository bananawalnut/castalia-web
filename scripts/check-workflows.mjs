import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateWorkflowText } from "./lib/workflow-policy.mjs";
const root = new URL("../.github/workflows/", import.meta.url);
const files = (await readdir(root)).filter((file) => /\.ya?ml$/.test(file));
if (!files.length)
  throw new Error("workflow policy fails closed: no workflows found");
const errors = [];
for (const file of files)
  errors.push(
    ...validateWorkflowText(await readFile(new URL(file, root), "utf8"), file),
  );
if (errors.length)
  throw new Error(`workflow policy failed:\n${errors.join("\n")}`);
console.log(`workflow policy passed: ${files.length} workflows`);
