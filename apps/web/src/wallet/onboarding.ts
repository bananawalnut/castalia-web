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
