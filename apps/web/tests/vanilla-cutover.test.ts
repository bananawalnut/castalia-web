import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(webRoot, path), "utf8");

describe("vanilla production cutover", () => {
  it("boots through the vanilla runtime", () => {
    const entry = read("src/main.ts");
    expect(entry).toContain('from "./runtime.js"');
    expect(entry).toContain("mountCastaliaApp(root)");
    expect(entry).not.toMatch(/react|createRoot|StrictMode/u);
  });

  it("uses plain Vite without React transforms", () => {
    const config = read("vite.config.ts");
    expect(config).not.toMatch(/plugin-react|react\(\)/u);
  });

  it("removes React from the web application dependency graph", () => {
    const manifest = JSON.parse(read("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
    };
    for (const name of [
      "react",
      "react-dom",
      "react-router",
      "@vitejs/plugin-react-swc",
      "@types/react",
      "@types/react-dom",
      "@testing-library/react",
      "@testing-library/user-event",
      "@testing-library/jest-dom",
    ]) {
      expect(dependencies).not.toHaveProperty(name);
    }
  });
});
