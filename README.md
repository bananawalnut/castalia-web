# Castalia Web

Private, fixture-only scaffold for the planned Castalia community selector, Matrix forum shell, community request/status flow, and contract documentation.

The repository now contains an executable local fixture shell and BFF. It does **not** provide live Matrix access, authentication, community or room provisioning, deployment evidence, runtime security approval, or production readiness. Public claims remain limited to the deterministic fixtures and contract surfaces described here and in the [product boundary](docs/product-boundary.md) and [claim ledger](docs/authority-and-claims.md).

## Architecture

- `apps/web` — React 19/Vite 7 declarative SPA with bounded fixture routes and visible unavailable states.
- `apps/bff` — Fastify 5 fixture BFF with process-health/session/fixture reads, strict environment validation, exact-origin CORS, security headers, and allowlisted logs.
- `packages/contracts` — authoritative OpenAPI 3.1 and JSON Schema 2020-12 sources, fixtures, checked-in generated TypeScript, and drift checks.
- `packages/ui` — small local UI primitives used by the fixture shell.
- `packages/matrix-client` — network-free, read-only interface and unavailable fixture; no Matrix SDK or privileged operations.

## Exact toolchain

Node `24.18.0`, pnpm `11.12.0`, Turborepo `2.10.4`, ESM, and strict TypeScript are pinned by repository configuration and the frozen lockfile.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
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
- GitHub workflows declare stable check names for CI, dependency review/policy, secrets, and CodeQL. Configuration is not evidence that hosted checks ran; absent or entitlement-blocked checks remain unavailable, not green.

See [documentation verification](docs/verification.md), [repository and implementation evidence](docs/repository-evidence.md), and the [canonical community registry authority decision](docs/community-registry-authority.md). Registry authority is currently unresolved, so registry behavior remains fixture-only and network-free.

## Fixture-only non-goals

This issue does not claim or implement live Matrix rooms/messages/sync, login/session cookies, registration/join/posting/redaction, registry lookup or mutation, hosted provisioning, administrator/appservice credentials, AI interpretation, production endpoints/secrets, HSTS/CDN/WAF/rate limits, deployment/rollback/signing, branch-rule binding, or production readiness. `/health` proves only that the local fixture process is responding.
