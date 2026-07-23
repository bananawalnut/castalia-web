# Dependency security evidence

Status: issue #11 remediation evidence. This document records the fail-closed baseline, the narrowly authorized dependency change, and exact-head verification. It does not create an exception or waive a scanner result.

## Baseline

Issue #11 branches from `origin/main` commit `6852185a0a07c1269a449eade5fcce57fa7380e3` and uses the repository-pinned Node `24.18.0` and pnpm `11.12.0` toolchain.

Before remediation, `pnpm security:dependencies` exited `1` with:

```text
Error: high or critical dependency vulnerability found
DEPENDENCY_POLICY_EXIT=1
```

The live audit reported two HIGH advisories for the same authority-delimiter host-confusion defect:

| Advisory | Vulnerable line present | Patched release |
| --- | --- | --- |
| 1124064 | `fast-uri` `3.1.3` | `3.1.4` |
| 1124063 | `fast-uri` `4.1.0` | `4.1.1` |

`pnpm why fast-uri -r` confirmed two transitive lines:

- `fast-uri@3.1.3` through AJV, `@fastify/ajv-compiler`, `env-schema`, and `fast-json-stringify@6`;
- `fast-uri@4.1.0` through `fast-json-stringify@7` and `@fastify/fast-json-stringify-compiler`;
- both ultimately serve the existing Fastify BFF and contract validation paths.

## Remediation contract

Issue #11 permits only same-major patched resolution:

- consumers of the 3.x line must resolve to `3.1.4`;
- consumers of the 4.x line must resolve to `4.1.1`;
- a cross-major override is forbidden;
- dependency-policy exceptions, severity changes, scanner bypasses, `continue-on-error`, and unrelated package upgrades are forbidden.

## Required GREEN evidence

The remediation is not complete until all of the following pass on the exact branch head:

- both vulnerable versions are absent from `pnpm-lock.yaml`;
- `pnpm why fast-uri -r` reports only `3.1.4` and `4.1.1`;
- `pnpm install --frozen-lockfile` succeeds;
- `pnpm security:dependencies` reports zero HIGH/CRITICAL findings;
- Fastify/AJV contract and negative-path tests pass;
- the complete `pnpm verify` gate passes;
- hosted dependency policy passes without an exception.

Exact-head GREEN and hosted evidence will be appended only after those commands actually complete.

## Issue #11 remediation evidence

Commit `ad99c22` adds two explicit same-major pnpm workspace overrides and the corresponding minimal lockfile update:

- `fast-uri@>=3.0.0 <4.0.0` resolves to `3.1.4`;
- `fast-uri@>=4.0.0 <5.0.0` resolves to `4.1.1`.

Observed after installation:

- `pnpm install --frozen-lockfile` — passed;
- `pnpm why fast-uri -r` — reports only `3.1.4` and `4.1.1` on their original major lines;
- live audit check — zero `fast-uri` advisories;
- forced uncached contracts tests — 4/4 passed;
- forced uncached BFF tests — 18/18 passed;
- forced uncached Matrix-client tests — 2/2 passed;
- forced uncached Web tests — 11/11 passed;
- forced uncached typechecks — seven tasks passed;
- contract lint, bundle, and generated-source checks — passed;
- formatting, lint, documentation, route claims, policy-negative tests, workflow/license checks, build/budgets, artifact scan, and startup budgets — passed before the dependency-policy step.

Issue #11 remains draft/blocked because a fresh audit surfaced unrelated advisories after it was scoped: HIGH `find-my-way` advisory 1124273 and MODERATE `react-router` advisories 1124268, 1124271, and 1124272. Those paths are routed to issue #14 rather than absorbed into this `fast-uri` change. `pnpm security:dependencies` and full `pnpm verify` therefore still exit `1`; neither result is waived or represented as green.

Hosted exact-head evidence remains pending. Issue #11 cannot satisfy its complete verification gate until issue #14 removes the newly disclosed router advisories and this branch is rebased onto that accepted baseline.
