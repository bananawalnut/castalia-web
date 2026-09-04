import { describe, expect, it } from "vitest";
import {
  castawayContents,
  createPrivateZenithIdentity,
  parseCastawayContents,
  parseCastawayEnvelope,
  parseZenithIdentitySection,
  selectedIdentityDisclosure,
} from "../src/index.js";

const runtimeMemberKey = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

describe("Castaway identity contract", () => {
  it("defaults a member to a private Person identity", () => {
    const identity = createPrivateZenithIdentity(
      runtimeMemberKey(),
      Date.now(),
    );
    expect(identity.subject.type).toBe("Person");
    expect(identity.subject.roles).toEqual([]);
    expect(
      Object.values(identity.subject.fields).every(
        ({ disclosure }) => disclosure === "private",
      ),
    ).toBe(true);
  });

  it("discloses only claims the member selected", () => {
    const identity = createPrivateZenithIdentity(
      runtimeMemberKey(),
      Date.now(),
    );
    identity.subject.fields.displayName = {
      value: "Ada Example",
      disclosure: "selected",
    };
    identity.subject.fields.biography = {
      value: "Private working notes",
      disclosure: "private",
    };
    identity.subject.roles.push({ role: "Researcher", disclosure: "selected" });
    const disclosure = selectedIdentityDisclosure(identity, Date.now());
    expect(disclosure.assurance).toBe("self-asserted");
    expect(disclosure.claims.fields).toEqual({ displayName: "Ada Example" });
    expect(disclosure.claims.fields).not.toHaveProperty("biography");
    expect(disclosure.claims.roles).toEqual(["Researcher"]);
  });

  it("fails closed on unknown sections, insecure URLs, and owner changes", () => {
    const identity = createPrivateZenithIdentity(
      runtimeMemberKey(),
      Date.now(),
    );
    const contents = castawayContents(identity);
    expect(parseCastawayContents(contents)).toEqual(contents);

    expect(() =>
      parseCastawayContents({
        ...contents,
        sections: { ...contents.sections, authority: { privateKey: "never" } },
      }),
    ).toThrow(/missing or unknown/u);
    expect(() =>
      parseZenithIdentitySection({
        ...identity,
        subject: {
          ...identity.subject,
          fields: {
            ...identity.subject.fields,
            website: { value: "http://example.test", disclosure: "private" },
          },
        },
      }),
    ).toThrow(/HTTPS/u);
    expect(() =>
      parseZenithIdentitySection({
        ...identity,
        subject: {
          ...identity.subject,
          memberKey: runtimeMemberKey().slice(2),
        },
      }),
    ).toThrow(/member key/u);
  });

  it("pins the portable encrypted envelope parameters", () => {
    const envelope = {
      schema: "castalia.castaway.v1",
      contentsSchema: "castalia.castaway-contents.v1",
      ownerPublicKey: runtimeMemberKey(),
      exportedAt: Date.now(),
      kdf: {
        name: "Argon2id",
        version: 19,
        salt: "A".repeat(22),
        memoryKiB: 65_536,
        iterations: 3,
        parallelism: 1,
        derivedKeyBytes: 32,
      },
      aead: {
        name: "AES-256-GCM",
        nonce: "A".repeat(16),
        tagBits: 128,
      },
      ciphertext: "A".repeat(22),
    };
    expect(parseCastawayEnvelope(envelope)).toEqual(envelope);
    expect(() =>
      parseCastawayEnvelope({
        ...envelope,
        kdf: { ...envelope.kdf, memoryKiB: 1 },
      }),
    ).toThrow(/KDF/u);
  });
});
