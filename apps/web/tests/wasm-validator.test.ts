import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { initSync } from "../src/generated/castalia-wallet-wasm/castalia_wallet_wasm.js";
import {
  parseWalletWasmDecision,
  validateWalletEnvelopeWithWasm,
} from "../src/wallet/wasm-validator.js";

describe("wallet WASM decision boundary", () => {
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
  it("accepts only the exact allow decision", () => {
    expect(parseWalletWasmDecision('{"allowed":true}')).toEqual({
      allowed: true,
    });
  });

  it("fails closed on malformed, incomplete, or widened decisions", () => {
    for (const output of [
      "not-json",
      "{}",
      '{"allowed":false}',
      '{"allowed":true,"sessionToken":"forbidden"}',
    ]) {
      expect(parseWalletWasmDecision(output)).toEqual({
        allowed: false,
        reason: "invalid-wasm-decision",
      });
    }
  });

  it("preserves a typed denial reason without other fields", () => {
    expect(
      parseWalletWasmDecision('{"allowed":false,"reason":"wrong-origin"}'),
    ).toEqual({ allowed: false, reason: "wrong-origin" });
  });

  it("executes the compiled Rust validator for exact browser envelopes", async () => {
    const envelope = {
      version: "castalia.wallet-onboarding.v1" as const,
      requestId: "req-01",
      origin: "https://castalia.example",
      audience: "castalia-hub",
      operation: "authenticate" as const,
      nonce: "nonce-01",
      issuedAtMs: 1_000,
      expiresAtMs: 31_000,
    };
    await expect(
      validateWalletEnvelopeWithWasm(envelope, {
        origin: "https://castalia.example",
        audience: "castalia-hub",
        nowMs: 10_000,
      }),
    ).resolves.toEqual({ allowed: true });
    await expect(
      validateWalletEnvelopeWithWasm(envelope, {
        origin: "https://evil.example",
        audience: "castalia-hub",
        nowMs: 10_000,
      }),
    ).resolves.toEqual({ allowed: false, reason: "wrong-origin" });
  });
});
