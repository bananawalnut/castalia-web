# Repository bootstrap evidence

Status: repository/bootstrap evidence for issue #1, captured from GitHub and Git. This record is bounded to the named repository at verification time; it is not application, deployment, or production evidence.

## Accepted repository identity

Issue [#1](https://github.com/ZenithResearch/castalia-web/issues/1) records the accepted owner `ZenithResearch` and repository `castalia-web`. GitHub resolves that exact pair as [`ZenithResearch/castalia-web`](https://github.com/ZenithResearch/castalia-web), with `main` as its default branch.

This is an independent web repository. It is not the Rust/Dregg Castalia repository, and its existence does not imply shared code, history, releases, runtime authority, or deployment with that project.

## Bounded owner and creation evidence

At capture time, GitHub reported:

| Probe | Observed result | Bounded interpretation |
| --- | --- | --- |
| Exact `ZenithResearch/castalia-web` repository lookup | Repository exists; owner/name match the accepted decision | The accepted owner/repository pair is occupied by this repository. This exact-name lookup is the duplicate guard; no second creation is required or claimed. |
| Repository `createdAt` | `2026-07-13T00:09:36Z` | GitHub records creation of this repository at that timestamp. It does not by itself identify the human who performed the action. |
The existence response, owner/name match, and creation timestamp are the retained repository creation evidence. No token, local path, private organization setting, or operator identity beyond public GitHub authorship is recorded here.

## Bootstrap commit

The default `main` branch resolves to bootstrap commit:

`b6452489a78b2f4c004bbe44f47fc38d5bff62e8` — `chore: initialize repository`

That commit adds the documentation-only README baseline. It is the base of this issue #1 branch, not proof of application scaffolding or functionality.

## Public provenance

- Accepted boundary and task ledger: [issue #1](https://github.com/ZenithResearch/castalia-web/issues/1)
- Branch: `docs/issue-1-boundaries`
- Draft review surface: [pull request #3](https://github.com/ZenithResearch/castalia-web/pull/3)
- Base branch and SHA: `main` at `b6452489a78b2f4c004bbe44f47fc38d5bff62e8`

Issue #2 is outside this documentation PR. This evidence does not implement or authorize its scaffold work. Pull request #3 must remain draft and unmerged until separately reviewed.

## Non-claims

This evidence does not claim:

- authorship or identity of the person who created the repository;
- branch protection, required checks, CI, or deployment;
- shared implementation or authority with Rust/Dregg Castalia;
- application scaffolding, Matrix access, provisioning, federation, AI interpretation, or production readiness.
