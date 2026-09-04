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
});
