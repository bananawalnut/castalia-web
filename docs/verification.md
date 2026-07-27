# Documentation verification

Status: documentation verification contract for the issue #9 Castalia Control authority reconciliation, preserving the issue #1 boundary and issue #2 fixture implementation as provenance. Passing these checks validates repository documentation shape and bounded wording only; it is not live upstream-service, Dregg authority, deployment, or production evidence.

## Run

From the repository root:

```sh
pnpm verify:docs
pnpm verify:routes
git diff --check origin/main...HEAD
pnpm verify
```

## What the script checks

- required issue #1/#9 documents, including repository evidence and the Castalia Control authority boundary, exist;
- current fixture implementation wording and issue #2 merge provenance are present;
- README Markdown links resolve to committed files;
- the canonical route inventory appears in the product boundary;
- Matrix, Castalia Control, infrastructure-provisioner, request/status, unavailable-forum, deferred-interpretation, precedence, and non-claim language is present;
- superseded separate-registry authority statements are absent from current README/product/authority surfaces;
- no tracked document contains common secret/private-key markers or operator-private absolute paths; and
- no tracked documentation links to a missing local file.

The checks are intentionally conservative text guards. Reviewers must still inspect the complete diff and claim strength. A passing script does not prove Matrix access, Castalia Control availability, wallet proof, anchored Dregg authority, provisioning, UI behavior, AI behavior, deployment, or production readiness.

## Acceptance mapping

| Issue #1 acceptance | Final evidence |
| --- | --- |
| Every current product claim has an owner/evidence gate or explicit non-claim | `docs/authority-and-claims.md` claim and non-claim ledgers |
| No unsupported Matrix, provisioning, federation, interpretation, or production claim | Authority ledger, visible-unavailable posture, deferred interpretation, and explicit non-claims |
| Navigation and unavailable states are explicit | `docs/product-boundary.md` route/navigation contract and forum posture in the authority ledger |
| Link, route, claim, secret/private-artifact, and whitespace checks | `scripts/verify-docs.sh` plus `git diff --check origin/main...HEAD` |
| Accepted repository identity, duplicate/creation evidence, bootstrap SHA, and public provenance | `docs/repository-evidence.md` |
| Issue #2 fixture implementation is distinguished from live integration | Current-state sections in `docs/product-boundary.md` and `docs/authority-and-claims.md` |
| I02 issue, pull request, merge commit, and post-merge limitations are recorded | `docs/repository-evidence.md` |

## Issue #9 authority-reconciliation evidence

The issue #9 branch began at `origin/main` commit `6852185a0a07c1269a449eade5fcce57fa7380e3`. The RED contract commit required the new authority source and failed with `missing required file: docs/castalia-control-authority.md`. The GREEN documentation commit added the source and reconciled current authority claims.

Verified on the issue #9 worktree:

- `pnpm verify:docs` — passed;
- `pnpm verify:routes` — passed with seven routes and four primary links;
- `pnpm format:check` — passed;
- forced uncached Turbo tests — contracts 4/4, Matrix client 2/2, BFF 18/18, Web 11/11; UI had no tests and exited successfully under its existing `--passWithNoTests` contract;
- forced uncached Turbo typechecks — seven tasks passed;
- contract lint/bundle/generated-source checks, policy-negative tests, workflow/license checks, build budgets, artifact scan, and startup budgets — passed during `pnpm verify`;
- `git diff --check` — passed.

The complete `pnpm verify` gate is not green on the unchanged dependency baseline: dependency policy reports two HIGH `fast-uri` advisories fixed upstream in `3.1.4` and `4.1.1`. Issue #9 changes no manifest or lockfile and does not remediate or waive that security failure; remediation is routed to issue #11.

Required hosted security checks are independently not green at the recorded issue #9 head. The `javascript-typescript` CodeQL check is red, and dependency review reports that it is unsupported until Dependency graph and GitHub Advanced Security are available for this private repository. Issue #9 changes no workflow or repository security setting; diagnosis and restoration are routed to issue #12.

The pull request must remain draft/blocked until issues #11 and #12 are resolved with exact-head green evidence or an authorized owner records an explicit unresolved external blocker. Passing issue #9 documentation checks must not be presented as full repository readiness.
