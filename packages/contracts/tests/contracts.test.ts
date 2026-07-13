import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import * as formatsModule from "ajv-formats";
import type { FormatsPlugin } from "ajv-formats";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const readJson = (path: string) =>
  JSON.parse(readFileSync(join(root, path), "utf8")) as object;

describe("canonical fixture contracts", () => {
  it("accepts positive fixtures and rejects negative fixtures", () => {
    const ajv = new Ajv2020({ strict: true });
    const addFormats = formatsModule.default as unknown as FormatsPlugin;
    addFormats(ajv);
    for (const name of ["community", "session", "community-request"]) {
      const validate = ajv.compile(readJson(`schema/${name}.schema.json`));
      expect(
        validate(readJson(`fixtures/positive/${name}.json`)),
        JSON.stringify(validate.errors),
      ).toBe(true);
      expect(validate(readJson(`fixtures/negative/${name}.json`))).toBe(false);
    }
  });

  it("uses 2020-12 stable ids and closed object shapes", () => {
    for (const name of ["community", "session", "community-request"]) {
      const schema = readJson(`schema/${name}.schema.json`) as Record<
        string,
        unknown
      >;
      expect(schema.$schema).toBe(
        "https://json-schema.org/draft/2020-12/schema",
      );
      expect(schema.$id).toBe(
        `https://castalia.example/schemas/${name}.schema.json`,
      );
      expect(schema.additionalProperties).toBe(false);
    }
  });

  it("publishes OpenAPI 3.1 without servers, auth, or mutations", () => {
    const source = readFileSync(
      join(root, "openapi/castalia-bff.openapi.yaml"),
      "utf8",
    );
    expect(source).toContain("openapi: 3.1.0");
    expect(source).not.toMatch(/^servers:/m);
    expect(source).not.toMatch(/securitySchemes|post:|put:|patch:|delete:/);
  });

  it("checks in deterministic generated TypeScript and drift tooling", () => {
    for (const path of [
      "src/generated/openapi.ts",
      "src/generated/community.ts",
      "src/generated/session.ts",
      "src/generated/community-request.ts",
      "scripts/generate.mjs",
      "scripts/check-generated.mjs",
    ]) {
      expect(existsSync(join(root, path)), path).toBe(true);
    }
  });
});
