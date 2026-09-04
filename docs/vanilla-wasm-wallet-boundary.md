# Vanilla TypeScript and wallet WASM boundary

## Current status

Castalia Web boots through the direct DOM/history runtime in `apps/web/src/main.ts` and `apps/web/src/runtime.ts`. React is not in the web application manifest or production entrypoint.

The enrollment-v2 verifier described below is now legacy compatibility code. The active `/start` path supports both extension-owned Wallet UI and an explicit first-party browser wallet. The browser wallet accepts a passphrase or recovery artifact, but its private key and decrypted seed remain inside a dedicated Worker backed by the Rust/WASM custody core. Page code receives only public identity fields, signatures for the fixed membership transcript, an encrypted recovery export, and the recovery key during the member-requested backup ceremony. Neither path constructs an application, contacts Control, or issues a login session.

## Ownership boundaries

- Castalia Wallet owns extension custody. Castalia Web owns the separate mobile browser-custody record described in [Mobile Web wallet](web-wallet-mobile.md).
- For legacy v1 only, Castalia Control owned challenge issuance, replay consumption, proof verification, application persistence, and lifecycle policy. Permissionless v2 base membership has none of those steps.
- `crates/castalia-wallet-wasm` independently validates the exact application and v2 presentation context, reconstructs the BLAKE3 application commitment, and returns only the exact Ed25519 verification bytes.
- `apps/web/src/wallet/wasm-validator.ts` accepts only the Rust module's finite result schema and uses browser WebCrypto to verify the Ed25519 signature.
- `apps/web/src/wallet/onboarding.ts` enforces challenge → Wallet confirmation → local verification → submission ordering and fails closed before submission.
- `apps/web/src/membership/control-client.ts` implements the exact uncredentialed challenge and application HTTP requests. It does not decide whether the member is admitted.

A generic localhost signing HTTP server, direct encrypted-directory access, a JS fallback signer, cookie authority, and proof persistence are intentionally absent. Browser custody exposes no generic site-facing signer; its Worker signs only operations invoked by the first-party wallet controller.

## Exact membership verification contract

The retained legacy operation is `castalia.membership.enroll` under challenge version `2` and presentation schema `castalia.wallet-membership-presentation.v2`. Its verification binds the Control-issued application commitment, challenge ID, nonce, browser origin, Control audience, operation, raw owner public key, signature suite, issue time, and expiry.

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

The public repository intentionally contains no deterministic browser-wallet seed, plaintext private-key fixture, or reusable recovery key. Custody tests generate ephemeral key material at runtime. The private cross-client compatibility suite remains responsible for any restricted fixed vectors.
