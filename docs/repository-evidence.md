# Repository and implementation evidence

Status: historical repository/bootstrap evidence for issue #1 plus post-merge fixture implementation evidence from issue #2. This record is bounded to the named repository and commits; it is not deployment or production evidence.

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

## Historical I01 public provenance

- Accepted boundary and task ledger: [issue #1](https://github.com/ZenithResearch/castalia-web/issues/1)
- Branch: `docs/issue-1-boundaries`
- Draft review surface: [pull request #3](https://github.com/ZenithResearch/castalia-web/pull/3)
- Base branch and SHA: `main` at `b6452489a78b2f4c004bbe44f47fc38d5bff62e8`

At the time this evidence was written, issue #2 was outside pull request #3 and its scaffold work was not yet merged. That statement is retained as historical I01 provenance, not current repository status.

## Post-merge I02 implementation evidence

- Scaffold and contract issue: [issue #2](https://github.com/ZenithResearch/castalia-web/issues/2)
- Reviewed implementation: [pull request #4](https://github.com/ZenithResearch/castalia-web/pull/4)
- Merge commit on `main`: `51fae5ee44aeefed0f23997c62950ed9d22e89fa`
- Post-merge CI: static, contracts/unit, build/budgets, and browser/a11y passed for the merge commit.
- Post-merge Security workflow: dependency policy and secret scanning passed.
- CodeQL remained unavailable at its upload boundary because GitHub Advanced Security is not available for this private repository; it is not represented as green.

This post-merge evidence establishes only the fixture implementation and its repository checks. It does not establish live Matrix or registry access, deployment, runtime security approval, or production readiness.

## Public migration and Pages deployment

On 2026-08-05, the current repository moved to the public [`bananawalnut/castalia-web`](https://github.com/bananawalnut/castalia-web) repository. Earlier `ZenithResearch/castalia-web` issue and pull-request links above remain historical provenance; they are not the current remote identity.

- Public main commit: `548f340d9b4e5b6f57c1a5875feb9bc36e6e19b3` — `ci: publish Castalia to GitHub Pages`
- Static fixture: <https://bananawalnut.github.io/castalia-web/>
- Exact-head hosted evidence: CI, Security, CodeQL, and Pages completed successfully.
- Pages uses workflow publishing from `main`; the deployed artifact contains the frontend only, with a project-base-aware router and static-host fallback.

This proves a public static-fixture deployment at the named commit. It does not prove live Matrix or registry access, BFF hosting, wallet authentication, Castalia Control integration, infrastructure provisioning, or production readiness.

## Non-claims

This evidence does not claim:

- authorship or identity of the person who created the repository;
- branch protection, required-check binding, or any deployment beyond the bounded static Pages fixture above;
- shared implementation or authority with Rust/Dregg Castalia;
- live Matrix or registry access, provisioning, federation, AI interpretation, or production readiness.
