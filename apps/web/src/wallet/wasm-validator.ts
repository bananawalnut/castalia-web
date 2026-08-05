import initWalletWasm, {
  validate_onboarding_envelope,
} from "../generated/castalia-wallet-wasm/castalia_wallet_wasm.js";
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
