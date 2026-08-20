# Vanilla TypeScript and wallet WASM boundary

## Current status

Castalia Web boots through the direct DOM/history runtime in `apps/web/src/main.ts` and `apps/web/src/runtime.ts`. React is not in the web application manifest or production entrypoint.

The enrollment-v2 verifier described below is now legacy compatibility code. The active `/start` path opens extension-owned Wallet UI and accepts Wallet's bounded verified membership summary, with `getMembership()` retained only for older no-detail ready events; it does not call this verifier, construct an application, or contact Control. Web is not a wallet, signer, login screen, admission authority, or authenticated session. No Web credential form accepts a passphrase, recovery material, private key, seed, or generic bytes to sign.

## Ownership boundaries

- Castalia Wallet owns key custody, extension-owned confirmation, and production of `castalia.wallet-membership-presentation.v2`.
- For legacy v1 only, Castalia Control owned challenge issuance, replay consumption, proof verification, application persistence, and lifecycle policy. Permissionless v2 base membership has none of those steps.
- `crates/castalia-wallet-wasm` independently validates the exact application and v2 presentation context, reconstructs the BLAKE3 application commitment, and returns only the exact Ed25519 verification bytes.
- `apps/web/src/wallet/wasm-validator.ts` accepts only the Rust module's finite result schema and uses browser WebCrypto to verify the Ed25519 signature.
- `apps/web/src/wallet/onboarding.ts` enforces challenge → Wallet confirmation → local verification → submission ordering and fails closed before submission.
- `apps/web/src/membership/control-client.ts` implements the exact uncredentialed challenge and application HTTP requests. It does not decide whether the member is admitted.

A generic localhost signing HTTP server, in-page key storage, direct encrypted-directory access, arbitrary `sign_bytes`, a JS fallback signer, cookie authority, and proof persistence are intentionally absent.

## Exact membership verification contract

The active operation is `castalia.membership.enroll` under challenge version `2` and presentation schema `castalia.wallet-membership-presentation.v2`. Verification binds the Control-issued application commitment, challenge ID, nonce, browser origin, Control audience, operation, raw owner public key, signature suite, issue time, and expiry.

Rust rejects malformed or unknown fields, non-canonical fixed-size encodings, owner mismatch, application-commitment mismatch, wrong version/origin/audience/operation, invalid application literals, future-issued or expired challenges, excessive lifetimes, and malformed signatures. It emits either a finite denial or the raw public key, transcript, and signature bytes. TypeScript rejects widened Rust output before invoking WebCrypto.

WebCrypto success is local evidence only. Castalia Control must independently reconstruct and verify the same transcript from its stored challenge and atomically enforce replay policy. Neither WASM nor browser JavaScript can consume a server challenge authoritatively or issue a session.

## Legacy compatibility

The earlier `castalia.wallet-onboarding.v1` envelope validator and `prepareWalletOnboarding` helper remain for downstream compatibility. They still return `pending-server-verification`, do not verify a signature, and are not called by the active `/start` membership flow.

Membership enrollment never downgrades to that legacy path. Wallet providers without `getSubject` and `requestMembershipPresentation` fail closed and must upgrade to the v2 provider contract.

## Generated module and verification

`pnpm --filter @castalia/web wasm:build` builds the Rust crate with `wasm-pack` into ignored `apps/web/src/generated/castalia-wallet-wasm/`. Web test, typecheck, and build scripts regenerate that module so stale generated code cannot silently pass.

Relevant gates:

```text
cargo fmt --all -- --check
cargo test -p castalia-wallet-wasm
cargo clippy -p castalia-wallet-wasm --all-targets -- -D warnings
pnpm --filter @castalia/web test
pnpm --filter @castalia/web typecheck
pnpm --filter @castalia/web build
pnpm browser:a11y
```

The positive fixed vector matches the Wallet v2 producer's application, challenge, canonical transcript, and signature. Negative cases mutate application context and a valid-length signature so formatting checks cannot masquerade as cryptographic verification.
