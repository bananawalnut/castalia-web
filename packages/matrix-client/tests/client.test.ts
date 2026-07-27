import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureMatrixReader } from "../src/index.js";

describe("fixture Matrix read port", () => {
  it("is deterministic, unavailable, and network-free", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (() => {
      calls += 1;
      throw new Error("network forbidden");
    }) as typeof fetch;
    try {
      const reader = createFixtureMatrixReader();
      expect(await reader.readCommunity("zenith")).toEqual({
        slug: "zenith",
        name: "Zenith",
        availability: "unavailable",
      });
      expect(await reader.readForum("zenith")).toEqual({
        status: "unavailable",
        reason: "fixture_only",
      });
      expect(await reader.readCommunity("other")).toBeNull();
      expect(calls).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("exposes no live Matrix mutation, auth, sync, history, provisioning, generic, admin, or appservice surface", () => {
    const source = readFileSync(
      join(import.meta.dirname, "../src/index.ts"),
      "utf8",
    );
    expect(source).not.toMatch(
      /matrix-js-sdk|\b(?:login|join|register|send|redact|sync|history|provision|generic|admin|appservice)\b/i,
    );
  });
});

