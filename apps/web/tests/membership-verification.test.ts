import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { initSync } from "../src/generated/castalia-wallet-wasm/castalia_wallet_wasm.js";
import { verifyMembershipPresentationWithWasm } from "../src/wallet/wasm-validator.js";

const application = {
  factoryId: "11".repeat(32),
  programId: "22".repeat(32),
  applicantOfficialDreggCellId: "33".repeat(32),
  ownerPublicKey:
    "03a107bff3ce10be1d70dd18e74bc09967e4d6309ba50d5f1ddc8664125531b8",
  applicationKind: 7 as const,
  applicationVersion: 1 as const,
  applicationNonce: 7,
  membershipClass: 1 as const,
  jurisdictionCode: 0,
  applicationFlags: 0 as const,
  createdAt: 1_700_000_000,
};
const presentation = {
  schema: "castalia.wallet-membership-presentation.v2" as const,
  ownerPublicKey: application.ownerPublicKey,
  challenge: {
    version: 2 as const,
    challengeId: "AAECAwQFBgcICQoLDA0ODw",
    nonce: "EBESExQVFhcYGRobHB0eHw",
    origin: "https://castalia.example",
    audience: "castalia-control-local",
    operation: "castalia.membership.enroll" as const,
    ownerPublicKey: application.ownerPublicKey,
    applicationCommitment:
      "f21ed04a6d39c8abcb5ebefd13bf0046c67daf967e18618e6e8fde54a68356b5",
    signatureSuite: 1 as const,
    issuedAt: 1_700_000_000_123,
    expiresAt: 1_700_000_060_123,
  },
  signatureSuite: "Ed25519" as const,
  signature:
    "6vScDhYJnMFhyuLTswLunqzhj1R5a7f9IGWI-5_sfQnBr1D3rSaH0-ZM7_D5HCJ1ngmRTtVhLmMlFeARfcUHCQ",
};

describe("independent Web membership presentation verification", () => {
  beforeAll(() => {
    initSync({
      module: readFileSync(
        resolve(
          import.meta.dirname,
          "../src/generated/castalia-wallet-wasm/castalia_wallet_wasm_bg.wasm",
        ),
      ),
    });
  });

  it("verifies the shared Wallet v2 vector", async () => {
    await expect(
      verifyMembershipPresentationWithWasm({
        application,
        presentation,
        expectedOrigin: "https://castalia.example",
        expectedAudience: "castalia-control-local",
        expectedOwnerPublicKey: application.ownerPublicKey,
        nowMs: 1_700_000_010_000,
      }),
    ).resolves.toEqual({
      verified: true,
      ownerPublicKey: application.ownerPublicKey,
    });
  });

  it("rejects a one-field application mutation before submission", async () => {
    const decision = await verifyMembershipPresentationWithWasm({
      application: { ...application, membershipClass: 2 },
      presentation,
      expectedOrigin: "https://castalia.example",
      expectedAudience: "castalia-control-local",
      expectedOwnerPublicKey: application.ownerPublicKey,
      nowMs: 1_700_000_010_000,
    });
    expect(decision.verified).toBe(false);
  });

  it("rejects a well-formed but invalid Ed25519 signature", async () => {
    const decision = await verifyMembershipPresentationWithWasm({
      application,
      presentation: {
        ...presentation,
        signature: `7${presentation.signature.slice(1)}`,
      },
      expectedOrigin: "https://castalia.example",
      expectedAudience: "castalia-control-local",
      expectedOwnerPublicKey: application.ownerPublicKey,
      nowMs: 1_700_000_010_000,
    });
    expect(decision).toEqual({
      verified: false,
      reason: "signature-invalid",
    });
  });
});
