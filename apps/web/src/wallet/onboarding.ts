import {
  parseMembershipPresentation,
  type IssuedCastaliaMembership,
  type MembershipChallengeResponseV2,
  type MembershipPresentationV2,
} from "../membership/contracts.js";
import type { MembershipControlClient } from "../membership/control-client.js";

export type WalletOnboardingRequest = {
  version: "castalia.wallet-onboarding.v1";
  requestId: string;
  origin: string;
  audience: string;
  operation: "authenticate";
  nonce: string;
  issuedAtMs: number;
  expiresAtMs: number;
};

export type WalletPresentation = {
  format: "castalia.wallet-presentation.v1";
  payload: string;
};

export type CastaliaWalletProvider = {
  kind: "castalia.wallet-provider";
  version: "1";
  getStatus(): Promise<{
    state: "locked" | "ready";
    publicIdentity?: string;
  }>;
  createAuthenticationPresentation(
    request: WalletOnboardingRequest,
  ): Promise<WalletPresentation>;
  getSubject?(): Promise<{
    subjectId: string;
    publicKey: string;
    dreggOwnerPublicKey: string;
    walletKind: "castalia-dregg";
  }>;
  requestMembershipPresentation?(input: {
    application: MembershipChallengeResponseV2["application"];
    challenge: MembershipChallengeResponseV2["challenge"];
  }): Promise<MembershipPresentationV2>;
};

export type WalletEnvelopeDenialReason =
  | "malformed"
  | "unsupported-version"
  | "wrong-origin"
  | "wrong-audience"
  | "wrong-operation"
  | "missing-field"
  | "not-yet-valid"
  | "expired"
  | "lifetime-too-long";

export type EnvelopeDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: WalletEnvelopeDenialReason | "invalid-wasm-decision";
    };

export type EnvelopeValidator = (
  envelope: WalletOnboardingRequest,
  expected: { origin: string; audience: string; nowMs: number },
) => Promise<EnvelopeDecision>;

export type WalletOnboardingContext = {
  origin: string;
  audience: string;
  nowMs: number;
  requestId: string;
  nonce: string;
};

export type WalletOnboardingResult =
  | { state: "unavailable"; reason: "provider-missing" }
  | { state: "locked"; reason: "wallet-locked" }
  | { state: "denied"; reason: string }
  | {
      state: "pending-server-verification";
      presentation: WalletPresentation;
    };

function isWalletProvider(value: unknown): value is CastaliaWalletProvider {
  if (typeof value !== "object" || value === null) return false;
  const provider = value as Record<string, unknown>;
  return (
    provider.kind === "castalia.wallet-provider" &&
    provider.version === "1" &&
    typeof provider.getStatus === "function" &&
    typeof provider.createAuthenticationPresentation === "function"
  );
}

function isWalletPresentation(value: unknown): value is WalletPresentation {
  if (typeof value !== "object" || value === null) return false;
  const presentation = value as Record<string, unknown>;
  return (
    Object.keys(presentation).sort().join(",") === "format,payload" &&
    presentation.format === "castalia.wallet-presentation.v1" &&
    typeof presentation.payload === "string" &&
    presentation.payload.length > 0
  );
}

export async function prepareWalletOnboarding(
  provider: unknown,
  context: WalletOnboardingContext,
  validateEnvelope: EnvelopeValidator,
): Promise<WalletOnboardingResult> {
  if (provider === undefined) {
    return { state: "unavailable", reason: "provider-missing" };
  }
  if (!isWalletProvider(provider)) {
    return { state: "denied", reason: "provider-contract-mismatch" };
  }

  let status: Awaited<ReturnType<CastaliaWalletProvider["getStatus"]>>;
  try {
    status = await provider.getStatus();
  } catch {
    return { state: "denied", reason: "provider-status-failed" };
  }
  if (status.state !== "ready") {
    return { state: "locked", reason: "wallet-locked" };
  }

  const envelope: WalletOnboardingRequest = {
    version: "castalia.wallet-onboarding.v1",
    requestId: context.requestId,
    origin: context.origin,
    audience: context.audience,
    operation: "authenticate",
    nonce: context.nonce,
    issuedAtMs: context.nowMs,
    expiresAtMs: context.nowMs + 60_000,
  };
  const decision = await validateEnvelope(envelope, {
    origin: context.origin,
    audience: context.audience,
    nowMs: context.nowMs,
  });
  if (!decision.allowed) {
    return { state: "denied", reason: decision.reason };
  }

  let presentation: unknown;
  try {
    presentation = await provider.createAuthenticationPresentation(envelope);
  } catch {
    return { state: "denied", reason: "presentation-failed" };
  }
  if (!isWalletPresentation(presentation)) {
    return { state: "denied", reason: "presentation-contract-mismatch" };
  }

  // This browser seam never turns a wallet proof into a session. A future
  // Castalia authority endpoint must verify the presentation and issue its own
  // protocol-native session before onboarding can continue.
  return {
    state: "pending-server-verification",
    presentation,
  };
}

export type MembershipOnboardingProgress =
  | "challenge-requested"
  | "wallet-confirmation"
  | "presentation-verification"
  | "membership-issuance";

export type VerifiedMembershipOnboardingResult =
  | { state: "locked"; reason: "wallet-locked" }
  | {
      state: "denied";
      reason:
        | "provider-contract-mismatch"
        | "provider-status-failed"
        | "provider-upgrade-required"
        | "subject-failed"
        | "subject-contract-mismatch"
        | "presentation-failed"
        | "presentation-invalid"
        | "service-failed";
    }
  | {
      state: "issued-unbound";
      ownerPublicKey: string;
      membership: IssuedCastaliaMembership;
    }
  | {
      state: "issued";
      ownerPublicKey: string;
      membership: IssuedCastaliaMembership;
    };

export type MembershipPresentationVerifier = (input: {
  application: MembershipChallengeResponseV2["application"];
  presentation: MembershipPresentationV2;
  expectedOrigin: string;
  expectedAudience: string;
  expectedOwnerPublicKey: string;
  nowMs: number;
}) => Promise<{ verified: true; ownerPublicKey: string } | { verified: false }>;

const HEX32 = /^[0-9a-f]{64}$/u;

export async function completeMemberOnboarding(input: {
  provider: CastaliaWalletProvider;
  origin: string;
  audience: string;
  control: MembershipControlClient;
  verifyPresentation: MembershipPresentationVerifier;
  nowMs?: () => number;
  onProgress?: (progress: MembershipOnboardingProgress) => void;
}): Promise<VerifiedMembershipOnboardingResult> {
  if (!isWalletProvider(input.provider))
    return { state: "denied", reason: "provider-contract-mismatch" };
  if (
    typeof input.provider.getSubject !== "function" ||
    typeof input.provider.requestMembershipPresentation !== "function"
  )
    return { state: "denied", reason: "provider-upgrade-required" };

  let status: Awaited<ReturnType<CastaliaWalletProvider["getStatus"]>>;
  try {
    status = await input.provider.getStatus();
  } catch {
    return { state: "denied", reason: "provider-status-failed" };
  }
  if (status.state !== "ready")
    return { state: "locked", reason: "wallet-locked" };

  let subject: Awaited<
    ReturnType<NonNullable<CastaliaWalletProvider["getSubject"]>>
  >;
  try {
    subject = await input.provider.getSubject();
  } catch {
    return { state: "denied", reason: "subject-failed" };
  }
  const subjectRecord = subject as unknown as Record<string, unknown>;
  if (
    subjectRecord.walletKind !== "castalia-dregg" ||
    typeof subjectRecord.dreggOwnerPublicKey !== "string" ||
    !HEX32.test(subjectRecord.dreggOwnerPublicKey)
  )
    return { state: "denied", reason: "subject-contract-mismatch" };
  const ownerPublicKey = subjectRecord.dreggOwnerPublicKey;

  const nowMs = input.nowMs ?? Date.now;
  let challenge: MembershipChallengeResponseV2;
  try {
    input.onProgress?.("challenge-requested");
    challenge = await input.control.issueChallenge({
      ownerPublicKey,
      origin: input.origin,
      nowMs: nowMs(),
    });
  } catch {
    return { state: "denied", reason: "service-failed" };
  }

  let presentationCandidate: unknown;
  try {
    input.onProgress?.("wallet-confirmation");
    presentationCandidate = await input.provider.requestMembershipPresentation({
      application: challenge.application,
      challenge: challenge.challenge,
    });
  } catch {
    return { state: "denied", reason: "presentation-failed" };
  }
  let presentation: MembershipPresentationV2;
  try {
    presentation = parseMembershipPresentation(
      JSON.stringify(presentationCandidate),
    );
  } catch {
    return { state: "denied", reason: "presentation-invalid" };
  }

  input.onProgress?.("presentation-verification");
  let verification: Awaited<ReturnType<MembershipPresentationVerifier>>;
  try {
    verification = await input.verifyPresentation({
      application: challenge.application,
      presentation,
      expectedOrigin: input.origin,
      expectedAudience: input.audience,
      expectedOwnerPublicKey: ownerPublicKey,
      nowMs: nowMs(),
    });
  } catch {
    return { state: "denied", reason: "presentation-invalid" };
  }
  if (!verification.verified || verification.ownerPublicKey !== ownerPublicKey)
    return { state: "denied", reason: "presentation-invalid" };

  try {
    input.onProgress?.("membership-issuance");
    const membership = await input.control.issueMembership({
      challenge,
      presentation,
    });
    return {
      state: "issued-unbound",
      ownerPublicKey,
      membership,
    };
  } catch {
    return { state: "denied", reason: "service-failed" };
  }
}
