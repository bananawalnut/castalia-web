import { describe, expect, it, vi } from "vitest";
import {
  prepareWalletOnboarding,
  type CastaliaWalletProvider,
  type EnvelopeDecision,
  type EnvelopeValidator,
} from "../src/wallet/onboarding.js";

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
