import initWalletWasm, {
  prepare_membership_presentation_verification,
  validate_onboarding_envelope,
} from "../generated/castalia-wallet-wasm/castalia_wallet_wasm.js";
import type {
  CastaliaMemberApplicationV1,
  MembershipPresentationV2,
} from "../membership/contracts.js";
import type {
  EnvelopeDecision,
  EnvelopeValidator,
  WalletEnvelopeDenialReason,
} from "./onboarding.js";

export const WALLET_WASM_DENIAL_REASONS = [
  "malformed",
  "unsupported-version",
  "wrong-origin",
  "wrong-audience",
  "wrong-operation",
  "missing-field",
  "not-yet-valid",
  "expired",
  "lifetime-too-long",
] as const satisfies readonly WalletEnvelopeDenialReason[];

export type WalletWasmDenialReason =
  (typeof WALLET_WASM_DENIAL_REASONS)[number];

const denialReasons = new Set<string>(WALLET_WASM_DENIAL_REASONS);
const invalidDecision: EnvelopeDecision = {
  allowed: false,
  reason: "invalid-wasm-decision",
};

export function parseWalletWasmDecision(output: string): EnvelopeDecision {
  let value: unknown;
  try {
    value = JSON.parse(output);
  } catch {
    return invalidDecision;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalidDecision;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length === 1 && keys[0] === "allowed" && record.allowed === true) {
    return { allowed: true };
  }

  if (
    keys.length === 2 &&
    keys[0] === "allowed" &&
    keys[1] === "reason" &&
    record.allowed === false &&
    typeof record.reason === "string" &&
    denialReasons.has(record.reason)
  ) {
    return {
      allowed: false,
      reason: record.reason as WalletEnvelopeDenialReason,
    };
  }

  return invalidDecision;
}

let walletWasmInitialization: Promise<unknown> | undefined;

const HEX32 = /^[0-9a-f]{64}$/u;
const HEX64 = /^[0-9a-f]{128}$/u;

function bytesFromHex(encoded: string): ArrayBuffer {
  const pairs = encoded.match(/../gu);
  if (!pairs) throw new Error("invalid verifier bytes");
  return Uint8Array.from(pairs, (pair) => Number.parseInt(pair, 16)).buffer;
}

export type MembershipPresentationVerification =
  | { verified: true; ownerPublicKey: string }
  | { verified: false; reason: string };

export async function verifyMembershipPresentationWithWasm(input: {
  application: CastaliaMemberApplicationV1;
  presentation: MembershipPresentationV2;
  expectedOrigin: string;
  expectedAudience: string;
  expectedOwnerPublicKey: string;
  nowMs: number;
}): Promise<MembershipPresentationVerification> {
  try {
    walletWasmInitialization ??= initWalletWasm();
    await walletWasmInitialization;
    const encoded = prepare_membership_presentation_verification(
      JSON.stringify(input.application),
      JSON.stringify(input.presentation),
      input.expectedOrigin,
      input.expectedAudience,
      input.expectedOwnerPublicKey,
      input.nowMs,
    );
    const decision = JSON.parse(encoded) as unknown;
    if (typeof decision !== "object" || decision === null)
      return { verified: false, reason: "invalid-wasm-decision" };
    const record = decision as Record<string, unknown>;
    if (record.allowed === false && typeof record.reason === "string")
      return { verified: false, reason: record.reason };
    if (
      record.allowed !== true ||
      typeof record.ownerPublicKey !== "string" ||
      !HEX32.test(record.ownerPublicKey) ||
      typeof record.transcriptHex !== "string" ||
      record.transcriptHex.length === 0 ||
      record.transcriptHex.length % 2 !== 0 ||
      !/^[0-9a-f]+$/u.test(record.transcriptHex) ||
      typeof record.signatureHex !== "string" ||
      !HEX64.test(record.signatureHex) ||
      Object.keys(record).sort().join(",") !==
        "allowed,ownerPublicKey,signatureHex,transcriptHex"
    )
      return { verified: false, reason: "invalid-wasm-decision" };

    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      bytesFromHex(record.ownerPublicKey),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const verified = await globalThis.crypto.subtle.verify(
      "Ed25519",
      key,
      bytesFromHex(record.signatureHex),
      bytesFromHex(record.transcriptHex),
    );
    return verified
      ? { verified: true, ownerPublicKey: record.ownerPublicKey }
      : { verified: false, reason: "signature-invalid" };
  } catch {
    return { verified: false, reason: "verification-unavailable" };
  }
}

export const validateWalletEnvelopeWithWasm: EnvelopeValidator = async (
  envelope,
  expected,
) => {
  try {
    walletWasmInitialization ??= initWalletWasm();
    await walletWasmInitialization;
    return parseWalletWasmDecision(
      validate_onboarding_envelope(
        JSON.stringify(envelope),
        expected.origin,
        expected.audience,
        expected.nowMs,
      ),
    );
  } catch {
    return { allowed: false, reason: "invalid-wasm-decision" };
  }
};
