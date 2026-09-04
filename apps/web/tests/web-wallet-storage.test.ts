import { describe, expect, it } from "vitest";
import { parseStoredWebWallet } from "../src/wallet/web-wallet-storage.js";

const randomHex32 = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

function legacyRecord() {
  return {
    schema: "castalia.web-wallet.v1",
    encryptedCustody: "runtime encrypted custody",
    identity: {
      ownerPublicKey: randomHex32(),
      mlDsa65PublicKey: "A".repeat(2603),
      mlDsa65PublicKeyCommitment: randomHex32(),
    },
    backupConfirmed: true,
    membership: null,
  };
}

describe("Web wallet storage compatibility", () => {
  it("hydrates the missing identity section on an existing v1 wallet", () => {
    expect(
      parseStoredWebWallet(legacyRecord()).encryptedIdentitySection,
    ).toBeNull();
  });

  it("accepts the additive sealed section and rejects unbounded data", () => {
    const current = {
      ...legacyRecord(),
      encryptedIdentitySection: "sealed-runtime-profile",
    };
    expect(parseStoredWebWallet(current).encryptedIdentitySection).toBe(
      "sealed-runtime-profile",
    );
    expect(() =>
      parseStoredWebWallet({
        ...current,
        encryptedIdentitySection: "x".repeat(1_048_577),
      }),
    ).toThrow(/malformed/u);
  });
});
