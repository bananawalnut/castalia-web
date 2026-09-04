import { beforeEach, describe, expect, it } from "vitest";
import {
  base64urlFromBytes,
  deriveZenithMembershipId,
  hexFromBytes,
  zenithMembershipCredentialTranscript,
  type ZenithMembershipTrustPolicyV1,
} from "@castalia/membership-contract";
import type { WebWalletCustodyClient } from "../src/wallet/web-wallet-client.js";
import { WebWalletSession } from "../src/wallet/web-wallet-session.js";
import type {
  StoredWebWallet,
  WebWalletStorage,
} from "../src/wallet/web-wallet-storage.js";
import { createPrivateZenithIdentity } from "@castalia/castaway-contract";

const randomHex32 = () =>
  hexFromBytes(globalThis.crypto.getRandomValues(new Uint8Array(32)));

function memoryStorage(): WebWalletStorage & {
  current: StoredWebWallet | null;
} {
  return {
    current: null,
    load() {
      return Promise.resolve(
        this.current ? structuredClone(this.current) : null,
      );
    },
    save(value) {
      this.current = structuredClone(value);
      return Promise.resolve();
    },
    clear() {
      this.current = null;
      return Promise.resolve();
    },
  };
}

function fakeCustody(ownerPublicKey: string): WebWalletCustodyClient {
  const identity = {
    ownerPublicKey,
    mlDsa65PublicKey: base64urlFromBytes(
      globalThis.crypto.getRandomValues(new Uint8Array(1952)),
    ),
    mlDsa65PublicKeyCommitment: randomHex32(),
  };
  let ready = false;
  return {
    create() {
      ready = true;
      return Promise.resolve({
        encryptedCustody: JSON.stringify({ encrypted: true }),
        identity,
        recoveryKey: `runtime-only-${randomHex32()}`,
      });
    },
    restoreFromRecoveryKey() {
      ready = true;
      return Promise.resolve({ encryptedCustody: "encrypted", identity });
    },
    unlock() {
      ready = true;
      return Promise.resolve(identity);
    },
    identity() {
      return ready
        ? Promise.resolve(identity)
        : Promise.reject(new Error("locked"));
    },
    recoveryKey() {
      return Promise.resolve(`runtime-only-${randomHex32()}`);
    },
    exportRandomized() {
      return Promise.resolve("encrypted");
    },
    sealIdentitySection(contents) {
      return Promise.resolve(`sealed:${btoa(contents)}`);
    },
    openIdentitySection(encrypted) {
      if (!encrypted.startsWith("sealed:"))
        return Promise.reject(new Error("malformed"));
      return Promise.resolve(atob(encrypted.slice("sealed:".length)));
    },
    exportCastaway(contents) {
      return Promise.resolve(
        JSON.stringify({
          schema: "castalia.castaway.v1",
          contentsSchema: "castalia.castaway-contents.v1",
          ownerPublicKey,
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
          ciphertext: base64urlFromBytes(new TextEncoder().encode(contents)),
        }),
      );
    },
    importCastaway(encrypted) {
      const value = JSON.parse(encrypted) as { ciphertext?: unknown };
      if (typeof value.ciphertext !== "string")
        return Promise.reject(new Error("malformed"));
      const padded = value.ciphertext.replaceAll("-", "+").replaceAll("_", "/");
      const bytes = Uint8Array.from(
        atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "=")),
        (character) => character.charCodeAt(0),
      );
      return Promise.resolve(new TextDecoder().decode(bytes));
    },
    signMembershipJoin() {
      return Promise.resolve(
        globalThis.crypto.getRandomValues(new Uint8Array(64)),
      );
    },
    lock() {
      ready = false;
      return Promise.resolve();
    },
    destroy() {
      ready = false;
    },
  };
}

describe("mobile Web wallet session", () => {
  let issuerKeys: CryptoKeyPair;
  let trustPolicy: ZenithMembershipTrustPolicyV1;
  let issuerFetch: typeof fetch;

  beforeEach(async () => {
    issuerKeys = await globalThis.crypto.subtle.generateKey(
      { name: "Ed25519" },
      true,
      ["sign", "verify"],
    );
    const issuerPublicKey = hexFromBytes(
      new Uint8Array(
        await globalThis.crypto.subtle.exportKey("raw", issuerKeys.publicKey),
      ),
    );
    trustPolicy = {
      schema: "castalia.zenith-membership-trust-policy.v1",
      version: 1,
      roots: [
        {
          issuerId: "zenith-research",
          keyId: "runtime-test-key",
          signatureSuite: "Ed25519",
          publicKey: issuerPublicKey,
        },
      ],
    };
    issuerFetch = async (_url, init) => {
      if (typeof init?.body !== "string")
        throw new Error("membership request body is missing");
      const candidate: unknown = JSON.parse(init.body);
      if (typeof candidate !== "object" || candidate === null)
        throw new Error("membership request is malformed");
      const ownerPublicKey = (candidate as { ownerPublicKey?: unknown })
        .ownerPublicKey;
      if (typeof ownerPublicKey !== "string")
        throw new Error("membership owner key is missing");
      const payload = {
        schema: "castalia.zenith-membership-credential.v3" as const,
        version: 3 as const,
        membershipId: await deriveZenithMembershipId(ownerPublicKey),
        ownerPublicKey,
        status: "active" as const,
        issuerId: "zenith-research",
        issuerKeyId: "runtime-test-key",
        signatureSuite: "Ed25519" as const,
      };
      const transcript = zenithMembershipCredentialTranscript(payload);
      const transcriptBuffer = new Uint8Array(transcript.byteLength);
      transcriptBuffer.set(transcript);
      const issuerSignature = base64urlFromBytes(
        new Uint8Array(
          await globalThis.crypto.subtle.sign(
            { name: "Ed25519" },
            issuerKeys.privateKey,
            transcriptBuffer.buffer,
          ),
        ),
      );
      return new Response(JSON.stringify({ ...payload, issuerSignature }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    };
  });

  it("blocks issuance until recovery is confirmed, then persists only the public credential", async () => {
    const ownerPublicKey = randomHex32();
    const storage = memoryStorage();
    const session = new WebWalletSession(
      fakeCustody(ownerPublicKey),
      storage,
      "https://membership.example",
      trustPolicy,
      issuerFetch,
    );

    await session.create("generated during this test only");
    await expect(session.issueMembership()).rejects.toThrow(
      "save and confirm a recovery method",
    );
    await session.confirmBackup();
    const membership = await session.issueMembership();

    expect(membership.ownerPublicKey).toBe(ownerPublicKey);
    expect(storage.current?.membership).toEqual(membership);
    expect(storage.current).not.toHaveProperty("passphrase");
    expect(storage.current).not.toHaveProperty("recoveryKey");

    if (!storage.current?.membership)
      throw new Error("membership was not persisted");
    storage.current.membership = {
      ...storage.current.membership,
      membershipId: randomHex32(),
    };
    expect((await session.snapshot()).membership).toBeNull();
  });

  it("treats recovery import as proof that a recovery method exists", async () => {
    const session = new WebWalletSession(
      fakeCustody(randomHex32()),
      memoryStorage(),
      "https://membership.example",
      trustPolicy,
      issuerFetch,
    );
    await session.restoreFromRecoveryKey(
      `runtime-only-${randomHex32()}`,
      "a new runtime passphrase",
    );
    expect((await session.snapshot()).backupConfirmed).toBe(true);
  });

  it("stores a bound identity profile only as a sealed Castaway section", async () => {
    const ownerPublicKey = randomHex32();
    const storage = memoryStorage();
    const session = new WebWalletSession(
      fakeCustody(ownerPublicKey),
      storage,
      "https://membership.example",
      trustPolicy,
      issuerFetch,
    );
    await session.create("generated during this test only");
    const profile = createPrivateZenithIdentity(ownerPublicKey, Date.now());
    profile.subject.fields.displayName.value = "Runtime Researcher";
    await session.saveIdentityProfile(profile);

    expect(storage.current?.encryptedIdentitySection).toMatch(/^sealed:/u);
    expect(storage.current?.encryptedIdentitySection).not.toContain(
      "Runtime Researcher",
    );
    expect(
      (await session.identityProfile()).subject.fields.displayName.value,
    ).toBe("Runtime Researcher");

    const wrongOwner = createPrivateZenithIdentity(randomHex32(), Date.now());
    await expect(session.saveIdentityProfile(wrongOwner)).rejects.toThrow(
      /different Member Key/u,
    );
  });

  it("round-trips the identity section through a portable Castaway export", async () => {
    const ownerPublicKey = randomHex32();
    const session = new WebWalletSession(
      fakeCustody(ownerPublicKey),
      memoryStorage(),
      "https://membership.example",
      trustPolicy,
      issuerFetch,
    );
    await session.create("generated during this test only");
    const profile = createPrivateZenithIdentity(ownerPublicKey, Date.now());
    profile.subject.fields.displayName = {
      value: "Portable Runtime Person",
      disclosure: "selected",
    };
    await session.saveIdentityProfile(profile);
    const vaultPassphrase = `runtime-${randomHex32()}`;
    const exported = await session.exportCastaway(vaultPassphrase);

    profile.subject.fields.displayName.value = "Locally changed";
    await session.saveIdentityProfile(profile);
    const imported = await session.importCastaway(exported, vaultPassphrase);
    expect(imported.subject.fields.displayName).toEqual({
      value: "Portable Runtime Person",
      disclosure: "selected",
    });
  });
});
