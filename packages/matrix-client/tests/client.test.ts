import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createFixtureMatrixReader,
  createFixtureSynapseUserRegistry,
} from "../src/index.js";

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

describe("fixture Synapse-user registry mock", () => {
  const publicUser = {
    userId: "@zenith:fixture.invalid",
    displayName: "Zenith",
    publicCommunity: true,
  } as const;

  it("maps an explicitly public synthetic user without network access", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (() => {
      calls += 1;
      throw new Error("network forbidden");
    }) as typeof fetch;
    try {
      const registry = createFixtureSynapseUserRegistry([publicUser]);
      expect(await registry.listCommunities()).toEqual([
        { slug: "zenith", name: "Zenith", availability: "unavailable" },
      ]);
      expect(calls).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not expose users that are not explicitly public fixtures", async () => {
    const registry = createFixtureSynapseUserRegistry([
      { ...publicUser, publicCommunity: false },
    ]);
    expect(await registry.listCommunities()).toEqual([]);
  });

  it.each([
    {
      name: "non-fixture homeserver",
      users: [{ ...publicUser, userId: "@zenith:example.org" }],
      error: "fixture.invalid",
    },
    {
      name: "malformed user id",
      users: [{ ...publicUser, userId: "zenith" }],
      error: "user id",
    },
    {
      name: "control character",
      users: [{ ...publicUser, displayName: "Zenith\nAdmin" }],
      error: "display name",
    },
    {
      name: "unexpected credential field",
      users: [{ ...publicUser, accessToken: "x" }],
      error: "unexpected fields",
    },
    {
      name: "duplicate identity",
      users: [publicUser, { ...publicUser }],
      error: "duplicate",
    },
  ])("rejects $name fail closed", ({ users, error }) => {
    expect(() => createFixtureSynapseUserRegistry(users)).toThrow(error);
  });
});
