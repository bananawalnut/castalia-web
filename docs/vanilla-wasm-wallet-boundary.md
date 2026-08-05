# Vanilla TypeScript and wallet WASM boundary

## Current status

Castalia Web now boots through the direct DOM/history runtime in `apps/web/src/main.ts` and `apps/web/src/runtime.ts`. React is not in the web application manifest or production entrypoint. The prior React sources remain inactive in the dirty checkout as a rollback reference until the migration is accepted; they are excluded from the TypeScript and Vitest production surfaces.

The wallet work is an onboarding seam, not a wallet, signer, login screen, or authenticated session. No credential form is rendered and no browser API accepts a passphrase, recovery material, private key, seed, or generic bytes to sign.

## Ownership boundaries

- `crates/castalia-wallet-wasm` owns deterministic validation of the exact short-lived onboarding request envelope.
- `apps/web/src/wallet/wasm-validator.ts` initializes the generated Rust module, accepts only its exact finite decision schema, and fails closed on malformed or widened output.
- `apps/web/src/wallet/onboarding.ts` defines the future injected-provider contract and returns a signed presentation only as `pending-server-verification`.
- A future approved browser extension/native-host bridge owns communication with the single canonical local signer. The browser must not read the canonical wallet store directly.
- A future Castalia authority endpoint must verify the presentation and issue its own protocol-native session. The browser seam cannot authenticate itself.

A generic localhost signing HTTP server, in-page key storage, direct encrypted-directory access, arbitrary `sign_bytes`, and JS/WebCrypto fallback signer are intentionally absent.

## Exact request contract

The only current operation is `authenticate` under `castalia.wallet-onboarding.v1`. The request binds request ID, browser origin, audience, nonce, issue time, and expiry. Rust rejects wrong version, origin, audience, operation, missing identifiers, future-issued, expired, overlong, malformed, and unknown-field envelopes.

Rust emits only one of:

- `{ "allowed": true }`
- `{ "allowed": false, "reason": <finite-kebab-case-reason> }`

TypeScript rejects extra fields—including token, key, credential, or secret-shaped additions—as `invalid-wasm-decision`.

Replay prevention and signature verification are not claimed. They belong to the canonical signer and remote authority because this stateless browser validator cannot authoritatively consume nonces.

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

## Recovery

The active cutover is reversible without rewriting the visual work: the previous React entrypoint and route components remain in the checkout, while `index.html`, `main.ts`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, and the web manifest identify the active Vanilla path. Reversal should restore those boundary files and dependencies as one operation; it must not alter the shared CSS, fixtures, bitmap assets, or ASCII river source.
