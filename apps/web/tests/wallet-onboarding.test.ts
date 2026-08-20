import { describe, expect, it, vi } from "vitest";
import {
  completeMemberOnboarding,
  prepareWalletOnboarding,
  type CastaliaWalletProvider,
  type EnvelopeDecision,
  type EnvelopeValidator,
} from "../src/wallet/onboarding.js";
import type { MembershipControlClient } from "../src/membership/control-client.js";

const requestContext = {
  origin: "https://castalia.example",
  audience: "castalia-hub",
  nowMs: 10_000,
  requestId: "req-01",
  nonce: "nonce-01",
};

const allow: EnvelopeValidator = vi.fn(
  (): Promise<EnvelopeDecision> => Promise.resolve({ allowed: true }),
);

describe("wallet onboarding seam", () => {
  it("fails closed when no approved provider is installed", async () => {
    await expect(
      prepareWalletOnboarding(undefined, requestContext, allow),
    ).resolves.toEqual({
      state: "unavailable",
      reason: "provider-missing",
    });
  });

  it("does not request a presentation while the canonical signer is locked", async () => {
    const createAuthenticationPresentation = vi.fn();
    const provider: CastaliaWalletProvider = {
      kind: "castalia.wallet-provider",
      version: "1",
      getStatus: () => Promise.resolve({ state: "locked" }),
      createAuthenticationPresentation,
    };

    await expect(
      prepareWalletOnboarding(provider, requestContext, allow),
    ).resolves.toEqual({
      state: "locked",
      reason: "wallet-locked",
    });
    expect(createAuthenticationPresentation).not.toHaveBeenCalled();
  });

  it("binds the exact authentication request and returns only a pending presentation", async () => {
    const createAuthenticationPresentation = vi.fn(() =>
      Promise.resolve({
        format: "castalia.wallet-presentation.v1" as const,
        payload: "public-signed-presentation",
      }),
    );
    const provider: CastaliaWalletProvider = {
      kind: "castalia.wallet-provider",
      version: "1",
      getStatus: () =>
        Promise.resolve({
          state: "ready",
          publicIdentity: "did:example:alice",
        }),
      createAuthenticationPresentation,
    };

    await expect(
      prepareWalletOnboarding(provider, requestContext, allow),
    ).resolves.toEqual({
      state: "pending-server-verification",
      presentation: {
        format: "castalia.wallet-presentation.v1",
        payload: "public-signed-presentation",
      },
    });
    expect(createAuthenticationPresentation).toHaveBeenCalledWith({
      version: "castalia.wallet-onboarding.v1",
      requestId: "req-01",
      origin: "https://castalia.example",
      audience: "castalia-hub",
      operation: "authenticate",
      nonce: "nonce-01",
      issuedAtMs: 10_000,
      expiresAtMs: 70_000,
    });
  });

  it("never calls the provider when WASM validation denies the request", async () => {
    const createAuthenticationPresentation = vi.fn();
    const provider: CastaliaWalletProvider = {
      kind: "castalia.wallet-provider",
      version: "1",
      getStatus: () => Promise.resolve({ state: "ready" }),
      createAuthenticationPresentation,
    };
    const deny: EnvelopeValidator = () =>
      Promise.resolve({
        allowed: false,
        reason: "wrong-origin",
      });

    await expect(
      prepareWalletOnboarding(provider, requestContext, deny),
    ).resolves.toEqual({
      state: "denied",
      reason: "wrong-origin",
    });
    expect(createAuthenticationPresentation).not.toHaveBeenCalled();
  });
});

describe("verified member onboarding", () => {
  const owner = "52".repeat(32);
  const application = {
    factoryId: "11".repeat(32),
    programId: "22".repeat(32),
    applicantOfficialDreggCellId: "33".repeat(32),
    ownerPublicKey: owner,
    applicationKind: 7 as const,
    applicationVersion: 1 as const,
    applicationNonce: 7,
    membershipClass: 1 as const,
    jurisdictionCode: 0,
    applicationFlags: 0 as const,
    createdAt: 1,
  };
  const challenge = {
    version: 2 as const,
    challengeId: "AAECAwQFBgcICQoLDA0ODw",
    nonce: "EBESExQVFhcYGRobHB0eHw",
    origin: "https://castalia.example",
    audience: "castalia-control-local",
    operation: "castalia.membership.enroll" as const,
    ownerPublicKey: owner,
    applicationCommitment: "ab".repeat(32),
    signatureSuite: 1 as const,
    issuedAt: 1_000,
    expiresAt: 61_000,
  };
  const challengeResponse = {
    challengeId: challenge.challengeId,
    application,
    applicationCommitment: challenge.applicationCommitment,
    challenge,
    expiresAt: challenge.expiresAt,
  };
  const presentation = {
    schema: "castalia.wallet-membership-presentation.v2" as const,
    ownerPublicKey: owner,
    challenge,
    signatureSuite: "Ed25519" as const,
    signature: "A".repeat(86),
  };

  function provider(): CastaliaWalletProvider {
    return {
      kind: "castalia.wallet-provider",
      version: "1",
      getStatus: () => Promise.resolve({ state: "ready" }),
      createAuthenticationPresentation: () =>
        Promise.resolve({
          format: "castalia.wallet-presentation.v1",
          payload: "legacy",
        }),
      getSubject: () =>
        Promise.resolve({
          subjectId: "did:castalia:member:test",
          publicKey: "pem",
          dreggOwnerPublicKey: owner,
          walletKind: "castalia-dregg",
        }),
      requestMembershipPresentation: () => Promise.resolve(presentation),
    };
  }

  it("verifies the wallet proof before issuing membership", async () => {
    const calls: string[] = [];
    const control: MembershipControlClient = {
      issueChallenge: () => {
        calls.push("challenge");
        return Promise.resolve(challengeResponse);
      },
      issueMembership: () => {
        calls.push("issue");
        return Promise.resolve({
          cellId: "44".repeat(32),
          ownerPublicKey: owner,
          state: "active",
          generation: 1,
          changedAt: 2_000,
          lastReceiptHash: "55".repeat(32),
        });
      },
    };
    const verifyPresentation = vi.fn(() => {
      calls.push("verify");
      return Promise.resolve({
        verified: true as const,
        ownerPublicKey: owner,
      });
    });

    await expect(
      completeMemberOnboarding({
        provider: provider(),
        origin: "https://castalia.example",
        audience: "castalia-control-local",
        control,
        verifyPresentation,
        nowMs: () => 2_000,
      }),
    ).resolves.toMatchObject({
      state: "issued-unbound",
      ownerPublicKey: owner,
    });
    expect(calls).toEqual(["challenge", "verify", "issue"]);
    expect(verifyPresentation).toHaveBeenCalledWith({
      application,
      presentation,
      expectedOrigin: "https://castalia.example",
      expectedAudience: "castalia-control-local",
      expectedOwnerPublicKey: owner,
      nowMs: 2_000,
    });
  });

  it("never issues when local signature verification fails", async () => {
    const issueMembership = vi.fn();
    const control: MembershipControlClient = {
      issueChallenge: () => Promise.resolve(challengeResponse),
      issueMembership,
    };
    await expect(
      completeMemberOnboarding({
        provider: provider(),
        origin: "https://castalia.example",
        audience: "castalia-control-local",
        control,
        verifyPresentation: () => Promise.resolve({ verified: false }),
        nowMs: () => 2_000,
      }),
    ).resolves.toEqual({
      state: "denied",
      reason: "presentation-invalid",
    });
    expect(issueMembership).not.toHaveBeenCalled();
  });

  it("snapshots an untrusted provider result exactly once", async () => {
    const toJSON = vi.fn(() => presentation);
    const untrustedPresentation = { toJSON } as unknown as typeof presentation;
    const wallet = provider();
    wallet.requestMembershipPresentation = () =>
      Promise.resolve(untrustedPresentation);
    const issueMembership = vi.fn(() =>
      Promise.resolve({
        cellId: "44".repeat(32),
        ownerPublicKey: owner,
        state: "active" as const,
        generation: 1,
        changedAt: 2_000,
        lastReceiptHash: "55".repeat(32),
      }),
    );

    await expect(
      completeMemberOnboarding({
        provider: wallet,
        origin: "https://castalia.example",
        audience: "castalia-control-local",
        control: {
          issueChallenge: () => Promise.resolve(challengeResponse),
          issueMembership,
        },
        verifyPresentation: ({ presentation: snapshot }) => {
          expect(snapshot).toEqual(presentation);
          expect(snapshot).not.toBe(untrustedPresentation);
          expect(Object.isFrozen(snapshot)).toBe(true);
          expect(Object.isFrozen(snapshot.challenge)).toBe(true);
          return Promise.resolve({
            verified: true as const,
            ownerPublicKey: owner,
          });
        },
        nowMs: () => 2_000,
      }),
    ).resolves.toMatchObject({ state: "issued-unbound" });
    expect(toJSON).toHaveBeenCalledOnce();
    expect(issueMembership).toHaveBeenCalledWith({
      challenge: challengeResponse,
      presentation,
    });
  });
});
