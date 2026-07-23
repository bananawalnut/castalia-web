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
