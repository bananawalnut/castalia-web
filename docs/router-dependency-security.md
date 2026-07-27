# Router dependency security evidence

Status: issue #14 remediation evidence stacked on the issue #11 `fast-uri` branch. This document records the newly disclosed router-advisory baseline and exact remediation gates. It does not weaken or waive dependency policy.

## Stack boundary

Issue #14 branches from issue #11 commit `826cf96a9713d922ca2e89e75ad40b8ac7ce4113`. Its pull request must target `security/issue-11-fast-uri`, so the review diff contains only router remediation. Issue #11 remains independently reviewable against `main`.

After both stacked changes are accepted, issue #14 may be integrated into issue #11; issue #11 must then rerun its complete local and hosted gates before either issue is ready for the user’s merge decision.

## RED baseline

A fresh live audit after both `fast-uri` advisories disappeared reports these issue #14 blockers:

| Advisory | Severity | Installed | Vulnerable range | First usable patched target |
| --- | --- | --- | --- | --- |
| 1124273 | HIGH | `find-my-way` `9.6.0` | `<=9.6.0` | `9.7.0` |
| 1124268 | MODERATE | `react-router` `7.15.1` | `>=6.0.0 <7.18.0` | `7.18.0` |
| 1124271 | MODERATE | `react-router` `7.15.1` | `>=7.11.0 <7.18.0` | `7.18.0` |
| 1124272 | MODERATE | `react-router` `7.15.1` | `>=6.4.0 <7.18.0` | `7.18.0` |

Dependency paths:

- `apps/bff > fastify@5.8.5 > find-my-way@9.6.0`;
- `apps/web > react-router@7.15.1`.

The advisory metadata names `find-my-way >=9.6.1` as patched, but `9.6.1` is not currently published. Registry enumeration confirms that `9.7.0` is the first published release above the vulnerable range. Fastify declares `find-my-way ^9.0.0`, so `9.7.0` remains within the parent’s compatible major range.

`pnpm security:dependencies` and full `pnpm verify` exit `1` at this baseline. No exception exists in `security/dependency-exceptions.json`.

## Remediation contract

- Keep `find-my-way` on compatible major 9 and select published `9.7.0`.
- Update direct `react-router` from `7.15.1` to `7.18.0` without a major change.
- Do not refresh unrelated dependency versions.
- Do not add an exception, severity reduction, scanner bypass, `continue-on-error`, or success stub.
- Preserve Fastify route matching, encoded-path handling, method/404 behavior, schema validation, browser routes, navigation, no-network behavior, and no-persistence behavior.

## Required GREEN evidence

- frozen-lockfile installation passes;
- all four advisory IDs disappear from a fresh live audit;
- dependency policy reports zero unexcepted MODERATE/HIGH/CRITICAL findings;
- forced uncached BFF, contract, Web, and browser tests pass;
- full `pnpm verify` passes on the exact stacked head;
- hosted dependency policy passes on the exact stacked head;
- CodeQL and dependency review remain separately governed by issue #12 and cannot be called green without successful hosted checks.

Exact GREEN and hosted evidence will be appended only after the commands complete.

## Issue #14 GREEN evidence

Commit `a790cf1` resolves Fastify’s compatible 9.x dependency to `find-my-way` `9.7.0`. Commit `09feb9f` updates direct `react-router` to `7.18.0` without a major change.

Verified on stacked head `09feb9fc3b70a594c7b49b6e7e8506d86cf0301d`:

- `pnpm install --frozen-lockfile` — passed;
- `pnpm why find-my-way -r` — reports only `9.7.0` through Fastify 5.8.5;
- `pnpm why react-router -r` — reports only direct `7.18.0` in the Web package;
- fresh live audit — advisories 1124273, 1124268, 1124271, and 1124272 are absent;
- dependency policy — passed with `moderate=0 high=0 critical=0`;
- forced uncached BFF tests — 18/18 passed;
- forced uncached contracts tests — 4/4 passed;
- Web tests — 11/11 passed;
- browser accessibility/privacy/navigation tests — 11/11 passed;
- route claims, typechecks, lint, contract generation, policy-negative tests, workflow/license checks, builds/budgets, startup budgets, artifact scan, and history secret scan — passed;
- complete `pnpm verify` — exited `0`.

The first local full run reached the browser gate before the configured temporary Playwright browser root had been populated. Chromium was installed into that temporary root and the unchanged exact head then passed all browser and full verification gates. Earlier Vitest worker timeouts were traced to a stale shell-level `NODE_ENV=production`; rerunning under the repository’s intended test environment passed without a source workaround. Neither local environment condition is represented as a product defect or tracked code change.

Hosted checks and independent reviews remain pending. Issue #12 still governs hosted CodeQL and dependency-review availability; issue #14 cannot claim those gates are green without successful exact-head checks.

## July 27 follow-up advisories

A fresh live audit before merge disclosed three later HIGH advisories that were not present during the original issue #14 verification:

| Advisory | Affected package | Installed | Patched target |
| --- | --- | --- | --- |
| 1124282 / GHSA-qwww-vcr4-c8h2 | `react-router` | `7.18.0` | `8.3.0` |
| 1124288 / GHSA-r28c-9q8g-f849 | `postcss` | `8.5.17` | `8.5.18` |
| 1124334 / GHSA-mh99-v99m-4gvg | `brace-expansion` | `1.1.16`, `2.1.2` | `5.0.8` |

The merge gate remained fail closed. The direct router dependency advances to the first patched major compatible with the repository's pinned Node 24 runtime. The transitive `postcss` and `brace-expansion` lines are resolved to patched releases through explicit pnpm overrides, with the complete static, unit, contract, policy, build, browser, startup, artifact, and live-audit gates required to detect incompatibility. No dependency-policy exception or severity waiver is added.
