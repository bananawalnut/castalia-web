# Documentation verification

Status: documentation verification contract for the issue #1 authority boundary and issue #2 fixture implementation. Passing these checks validates repository documentation shape and bounded wording only; it is not live upstream-service, deployment, or production evidence.

## Run

From the repository root:

```sh
pnpm verify:docs
pnpm verify:routes
git diff --check origin/main...HEAD
pnpm verify
```

## What the script checks

- required issue #1 documents, including repository evidence, exist;
- current fixture implementation wording and issue #2 merge provenance are present;
- registry authority-gap and offline Synapse-user mock boundaries are present;
- README Markdown links resolve to committed files;
- the canonical route inventory appears in the product boundary;
- authority, request/status, unavailable-forum, deferred-interpretation, precedence, and non-claim language is present;
- no tracked document contains common secret/private-key markers or operator-private absolute paths; and
- no tracked documentation links to a missing local file.

The checks are intentionally conservative text guards. Reviewers must still inspect the complete diff and claim strength. A passing script does not prove Matrix access, registry availability, provisioning, UI behavior, AI behavior, deployment, or production readiness.

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
| Synthetic Synapse-user registry mapping is fail-closed, private-safe, and network-free | `packages/matrix-client/tests/client.test.ts` and BFF tests |
| Canonical registry authority remains unresolved and separate from the mock | `docs/community-registry-authority.md` and `docs/authority-and-claims.md` |
