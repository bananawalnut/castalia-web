import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compileFromFile } from "json-schema-to-typescript";
import openapiTS, { astToString } from "openapi-typescript";
import { format } from "prettier";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const generatedRoot = join(root, "src/generated");
const bannerComment =
  "/** Generated from the canonical Castalia fixture contract. Do not edit. */";

export async function generateOutputs() {
  const outputs = new Map();
  const openapiPath = join(root, "openapi/castalia-bff.openapi.yaml");
  const openapiAst = await openapiTS(pathToFileURL(openapiPath), {
    alphabetize: true,
    silent: true,
  });
  outputs.set(
    "openapi.ts",
    await format(`${bannerComment}\n\n${astToString(openapiAst)}`, {
      parser: "typescript",
      printWidth: 120,
    }),
  );

  for (const name of ["community", "session", "community-request"]) {
    const source = join(root, `schema/${name}.schema.json`);
    const compiled = await compileFromFile(source, {
      additionalProperties: false,
      bannerComment,
      cwd: root,
      format: true,
      style: {
        printWidth: 120,
        tabWidth: 2,
        trailingComma: "all",
        useTabs: false,
      },
      unknownAny: true,
    });
    outputs.set(`${name}.ts`, compiled);
  }
  return outputs;
}

export async function writeGenerated() {
  await mkdir(generatedRoot, { recursive: true });
  for (const [name, content] of await generateOutputs())
    await writeFile(join(generatedRoot, name), content, "utf8");
}

const invokedPath = process.argv[1];
if (invokedPath !== undefined && fileURLToPath(import.meta.url) === invokedPath)
  await writeGenerated();
