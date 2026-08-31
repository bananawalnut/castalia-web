# Castalia Web

Public fixture scaffold and unprivileged Web client for Castalia's Zenith-signed membership v3 Join, planned Matrix forum shell, separate Control operations, and contract documentation.

The repository contains an executable fixture shell and BFF, the stateless Zenith membership issuer, and the Web verifier. `/start` opens extension-owned Wallet UI; Wallet proves possession of its durable Member Key, verifies the deterministic Zenith-signed credential, and hands that public credential to Web. Web independently verifies its exact fields, issuer-independent membership ID, pinned issuer key, and signature before displaying success. There is no individual/institution selector, application, review, Control call, cookie, or sign-in session. Dregg permissionless v2 remains preserved as a dormant forward-compatible path. See the [membership onboarding boundary](docs/membership-onboarding.md), [product boundary](docs/product-boundary.md), [claim ledger](docs/authority-and-claims.md), and [Castalia Control authority boundary](docs/castalia-control-authority.md).

## Public fixture

- Repository: <https://github.com/bananawalnut/castalia-web>
- Static frontend: <https://bananawalnut.github.io/castalia-web/>

The Pages site is deployment evidence for the static fixture only. It is not evidence of live upstream integration or production authority.

## Architecture

- `apps/web` — Vanilla TypeScript/Vite 7 direct-DOM SPA with bounded history routes and visible unavailable states.
- `apps/membership-issuer` — narrow stateless Node service that verifies Member Key possession and signs deterministic v3 credentials.
- `packages/membership-contract` — exact shared v3 schemas, transcripts, deterministic ID, trust policy, and browser verifier.
- `crates/castalia-wallet-wasm` — Rust/WASM validator that reconstructs the exact membership-v2 transcript and BLAKE3 application commitment for independent browser verification; it signs nothing, consumes no challenge, and issues no session.
- `apps/bff` — Fastify 5 fixture BFF with process-health/session/fixture reads, strict environment validation, exact-origin CORS, security headers, and allowlisted logs.
- `packages/contracts` — authoritative OpenAPI 3.1 and JSON Schema 2020-12 sources, fixtures, checked-in generated TypeScript, and drift checks.
- `packages/ui` — small local UI primitives used by the fixture shell.
- `packages/matrix-client` — network-free, read-only interface and unavailable fixture; no Matrix SDK or privileged operations.

The composition keeps responsibilities separate: Wallet owns the Member Key and verifies its v3 credential; Zenith initially operates the only trusted signer; Castalia Web independently verifies the same public credential and remains unprivileged; Dregg v2 is dormant; Control is reserved for narrower consequential operations; Matrix remains canonical for Matrix state. This repository implements membership issuance and display, not a sign-in session or provisioner.

## Exact toolchain

Node `24.18.0`, pnpm `11.12.0`, Turborepo `2.10.4`, ESM, and strict TypeScript are pinned by repository configuration and the frozen lockfile. The wallet validator currently builds with Rust `1.96.0`, the `wasm32-unknown-unknown` target, and `wasm-pack` `0.14.0`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @castalia/web wasm:build
cargo test -p castalia-wallet-wasm
pnpm verify
```

Focused evidence commands:

```sh
pnpm verify:routes
pnpm verify:policies
pnpm budgets:build
pnpm budgets:startup
pnpm security:licenses
CASTALIA_AUDIT_REPORT=/safe/path/pnpm-audit.json pnpm security:dependencies
pnpm security:secrets
pnpm security:bundle
pnpm browser:a11y
```

Browser downloads, reports, temporary files, and performance outputs honor `PLAYWRIGHT_BROWSERS_PATH`, `CASTALIA_OUTPUT_ROOT`, and `TMPDIR`. Harnesses create a unique fresh directory and never reset, clean, stash, or delete repository state.

## Verification and evidence boundaries

- Static gates check formatting, lint, strict types, documentation links, route inventory, exact navigation labels, bounded claims, and forbidden browser controls.
- Contract/unit gates cover generated-source drift, positive and negative fixtures, environment rejection, BFF headers/CORS/no-cookie/log redaction, and the network-free Matrix port.
- Browser gates use Chromium and `@axe-core/playwright` for 320px layout, keyboard/focus, `aria-current`, landmarks/headings, unavailable controls, browser persistence/network boundaries, and serious/critical axe findings.
- Performance gates enforce gzip bundle limits, fresh web/BFF/Turbo build durations, and 20-sample compiled fixture BFF `/health` startup p95/max limits; RSS is report-only with a 128 MiB warning.
- Security policy gates fail closed for unavailable/malformed dependency reports, denied or unreviewed licenses, secret scanners, contaminated emitted artifacts, and unsafe workflow changes. Synthetic negative tests prove those failure paths.
- GitHub workflows declare stable check names for CI, dependency review/policy, secrets, CodeQL, and Pages. Exact-head hosted results are recorded in the repository evidence; configuration alone is never treated as proof that a later run passed.

See [documentation verification](docs/verification.md), [repository and implementation evidence](docs/repository-evidence.md), the historical [community registry authority decision](docs/community-registry-authority.md), [dependency security evidence](docs/dependency-security.md), and [router dependency security evidence](docs/router-dependency-security.md) for bounded verification records.

Active product development is tracked through GitHub issues and evidence-backed pull requests. Issue #16's [RFC and Problem Board feature design](docs/issue-16-rfc-feature-design.md) defines a future community-facing RFC surface; it is not itself an RFC entry. The [RFC exchange architecture and authority map](docs/architecture/rfc-exchange.md) is the implementation entry point for component ownership, canonical versus generated state, Gate 2's local-export-only boundary, and the external WMT prerequisite.

## Current non-goals

This increment does not claim or implement live Matrix rooms/messages/sync, login/session cookies, an authenticated Web session, `dga1_` custody/presentation, registration/posting/redaction, hosted provisioning, administrator/appservice credentials, AI interpretation, production issuer-key custody, HSTS/CDN/WAF/rate limits, production deployment/rollback, branch-rule binding, or production readiness. `/start` reports membership only after cryptographically verifying an Active v3 credential. `/health` proves only that a process is responding.
