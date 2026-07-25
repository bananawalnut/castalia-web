# RFC 0001 — World Model Trajectories for RFC peer review

- Status: Draft
- Scope: Product and integration contract only
- Target repository: `ZenithResearch/castalia-web`
- Engine source: `bananawalnut/world-model-trajectories`
- Pinned engine commit reviewed for this draft: `2508ea2c466633c0d270eedf42f46744120d439e`
- Last updated: 2026-07-25

## Summary

Castalia Web should let a community inspect whether the formalized claims in an RFC can hold together, where irreducible disagreements occur, which coherent positions remain, and what a proposed revision changes. It should do this with the World Model Trajectories (WMT) engine from the owned fork, locally in the browser, while keeping human peer review and community decisions authoritative.

The first integration is a read-only analysis instrument. It does not decide truth, approve an RFC, rank reviewers, allocate funds, mutate Matrix state, or execute governance. A model may propose a formalization only in a later, separately authorized phase. The initial path imports human-reviewed typed IR and exposes the natural-language-to-logic seam.

## Objective

A reviewer should be able to:

1. open a repository-backed RFC revision;
2. inspect each natural-language claim beside its source locator and plain-English back-translation;
3. confirm or reject the formalization before analysis;
4. run WMT locally;
5. inspect consistency, minimal conflicts, coherent positions, forced consequences, and bounded repair suggestions;
6. fork a candidate revision without overwriting the accepted source;
7. submit a peer-review artifact that cites the exact RFC revision, claim-set digest, engine commit, and analysis result; and
8. leave approval, rejection, funding, and governance to the community's separately authorized process.

## Why WMT fits this surface

The reviewed fork already provides the relevant reasoning kernel:

- typed many-sorted first-order IR as JSON;
- deterministic IR-to-English rendering;
- a Rust-to-Wasm engine that emits solver scripts;
- Z3 4.16 in the browser;
- explicit `unknown` handling;
- minimal conflicts, maximal coherent positions, repair suggestions, and forced consequences;
- same-claim-ID revision semantics;
- state export/import and forkable trajectory snapshots; and
- defeasible reasoning where a general default may yield to a more specific claim without hiding strict contradictions.

The engine's claim is bounded: consistency of the formalization, not truth or faithful natural-language interpretation. Castalia Web must preserve that boundary everywhere.

## Current evidence and limitations

The pinned fork commit is public, is currently tree-identical to `emberian/world-model-trajectories` `main`, and has no fork-only product delta. The owned fork is nevertheless the dependency source and update-control surface for this proposal.

At the reviewed commit:

- `cargo test` passes 27 tests, with one live LLM self-probe ignored;
- the crate exposes `ingest`, `meta`, `prompt`, state import/export, analysis, lattice, witness, and defeasible step-driver methods through `wasm-bindgen`;
- the browser shell drives Z3 separately from the Rust engine;
- the trajectory tree is UI-owned and stored in `localStorage`;
- optional auto-formalization sends sentences and vocabulary to OpenRouter and stores a bring-your-own key in `localStorage`;
- the first browser load fetches roughly 34 MiB of Z3 Wasm; and
- the current repository is a static application, not a versioned embeddable package for Castalia Web.

Those last four facts prevent direct reuse of the current site shell. Castalia Web should consume a bounded engine package from the fork, not copy `site/app.js` or embed the existing page.

## Product boundary

### RFC source

An RFC remains a repository-backed artifact with immutable revision identity. The Markdown document is the human source. Its typed claim set is a sidecar bound to the exact document revision by digest.

The WMT view is derived evidence. It cannot silently rewrite the RFC, replace peer-review prose, or become the canonical source of a community decision.

### Peer review

Peer review is a signed or repository-attributed response to an exact RFC revision. It may:

- accept or contest a formalization;
- identify missing claims or source spans;
- propose a claim revision;
- identify a genuine disagreement;
- propose an alternative coherent position; or
- state that the solver result is `unknown`, incomplete, or irrelevant to the substantive question.

A WMT analysis can support a review. It cannot constitute a review by itself.

### Authority

This RFC does not change the current Castalia Web authority ledger.

- Matrix remains canonical for Matrix state.
- Castalia Control/Dregg authority remains outside this RFC.
- The repository remains canonical for the RFC revision and checked-in peer-review artifacts in the first slice.
- WMT is authoritative only for deterministic analysis produced by the pinned engine and solver over the exact typed claim set supplied to it.
- Humans and the community's accepted process remain authoritative for formalization acceptance, RFC disposition, and every consequential action.

## Proposed artifact contracts

The schemas below are normative field sets for later JSON Schema work. They are not implemented by this RFC.

### `RfcClaimSetV1`

Required fields:

- `schema_version`: exactly `castalia.rfc-claim-set.v1`;
- `rfc_id`: stable RFC identifier;
- `rfc_revision`: immutable repository commit or content-addressed revision identifier;
- `rfc_digest`: digest of the exact canonical RFC bytes;
- `claim_set_digest`: digest of the canonical claim-set bytes excluding this field;
- `engine_target`: owned fork URL plus exact commit;
- `sorts`, `predicates`, and `functions`: the shared typed vocabulary;
- `claims`: ordered WMT-compatible claims; and
- `formalization_reviews`: review references proving which claim mappings were confirmed, contested, or not reviewed.

Each claim must add Castalia provenance to the WMT fields:

- stable `id`;
- exact natural-language `source`;
- `source_locator` pointing to the RFC heading, paragraph, or line range;
- typed `formula`;
- deterministic or model-supplied `back` translation;
- `weight` with a named provenance rather than an unexplained number;
- `active`;
- `defeasible`;
- `formalization_status`: `unreviewed`, `confirmed`, `contested`, or `rejected`; and
- `formalization_review_refs`.

No claim with `unreviewed`, `contested`, or `rejected` formalization status may contribute to an authoritative-looking green/coherent summary. The UI must separate exploratory analysis from a fully confirmed claim-set analysis.

### `RfcAnalysisV1`

Required fields:

- `schema_version`: exactly `castalia.rfc-analysis.v1`;
- `rfc_id`, `rfc_revision`, `rfc_digest`, and `claim_set_digest`;
- `engine_repository` and exact `engine_commit`;
- solver identity and version;
- analysis mode: `strict` or `defeasible`;
- status: `coherent`, `inconsistent`, `unknown`, `budget_exhausted`, or `invalid`;
- minimal conflicts found;
- maximal coherent positions found;
- whether enumeration is exhaustive;
- forced consequences and their minimal witness claim IDs;
- repair suggestions with entrenchment totals;
- excluded claim IDs and reasons;
- start/end timestamps and bounded runtime metrics; and
- a digest of the canonical result bytes.

`budget_exhausted` means every reported conflict or position is real but the set may be incomplete. It must never be rendered as `coherent` or as an exhaustive decision surface.

### `RfcPeerReviewV1`

Required fields:

- `schema_version`: exactly `castalia.rfc-peer-review.v1`;
- review ID and reviewer attribution reference;
- exact RFC and claim-set revision bindings;
- optional exact analysis digest;
- disposition: `comment`, `request_revision`, `approve_formalization`, `reject_formalization`, `approve_rfc`, or `reject_rfc`;
- cited claim IDs and source locators;
- prose rationale;
- optional proposed claim patch or candidate branch reference;
- disclosure of model assistance; and
- repository commit/signature evidence when available.

The first slice may use Git commit attribution and pull-request review evidence. Wallet/Dregg-backed reviewer standing is a future authority integration and must not be invented here.

## Integration architecture

```text
Repository-backed RFC Markdown + typed claim sidecar
                    |
                    v
        Castalia contract validation
  digest binding / schema / source locators
                    |
                    v
      dedicated browser Web Worker
  pinned WMT core + pinned Z3 Wasm assets
                    |
                    v
      deterministic local analysis
  status / MUS / positions / witnesses / repair
                    |
                    v
       non-authoritative review UI
                    |
                    v
 explicit export of analysis + peer-review artifact
        (no automatic upstream mutation)
```

### Dependency boundary

The WMT fork must first produce an embeddable, versioned browser-engine release. That prerequisite should:

1. expose the Wasm facade and Z3 driver behind one documented worker-safe adapter;
2. publish JSON schemas or generated types for inputs and outputs;
3. include licenses for WMT, Z3, and the isolation shim;
4. publish a manifest containing source commit, toolchain versions, artifact digests, and test evidence;
5. preserve `unknown` and enumeration-budget states exactly;
6. contain no UI, OpenRouter call, API-key storage, or implicit persistence; and
7. run native and real-browser conformance tests before release.

Castalia Web then pins the exact fork commit and artifact digests. It must not track a mutable branch, download code at runtime from GitHub, or copy unversioned generated Wasm into this repository without provenance.

### Worker and browser isolation

Solver work should run in a dedicated worker so long analyses cannot block navigation or review controls. The adapter must serialize one Z3 session per worker, enforce an operation budget, support cancellation by terminating the worker, and return typed failure states.

The existing WMT site relies on cross-origin isolation support for multi-threaded Z3 Wasm. The integration issue must prove the exact production header/service-worker strategy in Castalia Web rather than assuming the current static-site shim composes with Vite, the BFF, or a deployment target.

### Persistence

The first slice is memory-only until the user explicitly exports an artifact. It does not use `localStorage`, `sessionStorage`, cookies, IndexedDB, service workers for data persistence, or automatic uploads.

A later persistence issue may add explicit local or repository-backed saves after privacy, encryption, provenance, and lifecycle rules are accepted. WMT's existing local trajectory tree is a product reference, not reusable persistence authority.

### Formalization seam

The first slice does not call OpenRouter or any other model provider. It accepts checked-in typed IR or manual pasted IR and requires the English back-translation to be reviewed.

Any later assisted formalization must be a separate RFC or amendment that defines:

- the authorized model path;
- exactly what text and vocabulary leave the browser;
- consent and disclosure;
- credential custody outside browser persistence;
- output validation;
- formalization-review workflow; and
- a no-network path that remains fully usable.

## User experience

The first review surface should show five layers in order:

1. **Source** — exact RFC revision and digest.
2. **Formalization** — source sentence, source locator, back-translation, status, and reviewer evidence.
3. **Analysis** — coherent, inconsistent, unknown, invalid, or budget-exhausted with engine/solver provenance.
4. **Positions** — irreducible disagreements, coherent alternatives, consequences, and repair suggestions.
5. **Human decision** — peer-review controls that make clear no solver result chooses the RFC disposition.

Required language:

- “Consistency of the confirmed formalization, not truth.”
- “A repair is a suggestion, not a verdict.”
- “Unknown is not consistent.”
- “This analysis does not approve, reject, fund, or execute the RFC.”

The UI must never use green/coherent styling to imply truth, consensus, governance approval, or funding eligibility.

## Privacy and security requirements

- Default to public or explicitly reviewer-authorized RFC text. Never ingest private Matrix room content merely because the browser can display it.
- Bind every result to exact RFC bytes, claim-set bytes, engine commit, and solver version.
- Reject digest mismatch, schema mismatch, duplicate claim IDs, conflicting vocabulary declarations, invalid source locators, and unsupported engine versions before solver startup.
- Treat auto-declaration as exploratory convenience only. A reviewable claim set must declare its vocabulary explicitly; inferred declarations must be visible and block final formalization approval.
- Bound claim count, input bytes, quantifier depth or supported profile, solver rounds, worker runtime, output bytes, and rendered graph size.
- Surface Z3 errors and `unknown`; never coerce them into a verdict.
- Escape all source, back-translation, gloss, and reviewer content. Do not use raw HTML assembly for untrusted fields.
- Keep solver scripts and result internals out of logs unless a reviewer explicitly exports a redacted diagnostic artifact.
- Do not store provider keys, wallet material, Matrix tokens, capabilities, or review credentials in WMT state.
- Scan shipped browser artifacts for credentials and unexpected network endpoints.
- Preserve WMT and Z3 license notices in distributions.

## Failure semantics

| Condition | Required behavior |
| --- | --- |
| RFC or claim-set digest mismatch | Reject before analysis; do not offer a repair. |
| Unconfirmed formalization | Mark analysis exploratory; block approval based on it. |
| WMT ingest error | Show `invalid` with bounded diagnostics. |
| Z3 `unknown` or malformed output | Show `unknown`; never treat as coherent. |
| Enumeration budget reached | Show `budget_exhausted`; reported sets are partial. |
| Worker timeout or crash | Terminate worker, discard partial unbound output, permit explicit retry. |
| Engine/artifact digest mismatch | Fail closed before loading Wasm. |
| Cross-origin isolation unavailable | Show analysis unavailable; do not fall back to remote execution. |
| Proposed model formalization in first slice | Reject as unsupported; preserve manual/import path. |
| Analysis suggests a repair | Require a new candidate RFC revision; never mutate the source in place. |

## Delivery sequence

### Gate 0 — fork packaging prerequisite

Owned by `bananawalnut/world-model-trajectories`.

- Define the embeddable worker adapter and schemas.
- Remove site UI, OpenRouter, and persistence from the package boundary.
- Publish manifest, licenses, artifact digests, native tests, and browser conformance evidence.
- Prove fork/upstream relationship and update policy.

Stop if the fork cannot produce reproducible pinned artifacts without importing the static site shell.

### Gate 1 — Castalia contracts and fixtures

Owned by `ZenithResearch/castalia-web`.

- Add canonical JSON Schemas and generated TypeScript for the three RFC artifacts.
- Add positive and hostile fixtures for digest binding, status handling, duplicate IDs, undeclared vocabulary, unknown/budget states, and source locators.
- Keep all routes fixture-only and network-free.

### Gate 2 — local read-only analysis

- Load the pinned package in a dedicated worker.
- Render source/formalization/analysis layers.
- Prove no persistence and no network beyond same-origin static assets.
- Prove cancellation, limits, unknown, malformed, timeout, and budget behavior.

### Gate 3 — repository-backed peer review

- Export deterministic analysis and review artifacts.
- Bind proposed revisions to parent RFC revisions.
- Use repository/PR attribution only; do not claim wallet or community-standing authority.
- Require human action to submit or merge every review/revision.

### Gate 4 — optional assisted formalization

Deferred. Requires its own accepted privacy, provider, credential, and authority contract.

## Verification plan

The implementation issue train must include:

- native WMT tests against the pinned source;
- exact artifact digest and license checks;
- browser conformance for WMT plus Z3 in the worker;
- JSON Schema positive/negative fixtures;
- deterministic repeated-analysis fixtures;
- semantic reachability tests for `unknown`, budget, digest mismatch, and malformed solver output;
- no-network and no-persistence browser tests;
- worker cancellation and resource-budget tests;
- XSS tests for source/back-translation/reviewer fields;
- bundle endpoint and secret scans;
- accessibility and 320 px layout checks;
- exact copy checks for the non-authoritative claim boundary; and
- independent exact-head technical, security/privacy, and product/governance reviews.

## Acceptance criteria for this RFC

This RFC is ready to move from Draft to Accepted only when:

- the WMT fork maintainer confirms the packaging prerequisite is feasible;
- technical review confirms the proposed contracts map to actual WMT behavior;
- security/privacy review finds no unresolved high-severity issue;
- product/governance review confirms solver evidence cannot masquerade as peer review or authority;
- the current Castalia authority ledger is not broadened;
- every peer-review finding is resolved, explicitly deferred with an owner/gate, or preserved as minority dissent; and
- the user explicitly accepts the RFC.

Acceptance authorizes issue decomposition. It does not authorize implementation, merge, deployment, model calls, credentials, Matrix access, or governance actions.

## Open decisions

1. Which repository file layout should be canonical for RFC Markdown, claim sidecars, analyses, and peer reviews?
2. Which digest canonicalization standard should bind JSON artifacts?
3. What bounded first-slice logic profile should Castalia support beyond WMT's general IR?
4. Should the first UI support only strict reasoning, or expose defeasible mode with a separate explicit reviewer choice?
5. Which exact deployment header strategy will support Z3 Wasm without broadening origin isolation risk?
6. What reviewer attribution evidence is sufficient before wallet/Dregg standing is integrated?
7. What claim-count and solver-work budgets produce a useful first review surface on supported devices?
8. Should analysis artifacts be checked in, reproducibly regenerated in CI, or both?

## Explicit non-claims

This RFC does not prove or authorize:

- truth, factual accuracy, community consensus, RFC acceptance, reviewer standing, funding eligibility, or governance validity;
- natural-language-to-logic faithfulness without human review;
- exhaustive analysis when the budget is reached;
- live Matrix reading, private-room ingestion, identity exposure, or Matrix mutation;
- wallet, Dregg, Castalia Control, provisioning, treasury, or execution authority;
- OpenRouter or any other model-provider integration;
- current availability of an embeddable WMT package;
- implementation in Castalia Web; or
- deployment or production readiness.

## Source ledger

- `https://github.com/bananawalnut/world-model-trajectories` at `2508ea2c466633c0d270eedf42f46744120d439e`
- `README.md` in that commit for the bounded product claim, architecture, tests, browser constraints, and model seam
- `crate/src/lib.rs` in that commit for the typed IR and Wasm facade
- `site/app.js` in that commit for current Z3 driving, trajectory persistence, optional OpenRouter path, and browser behavior
- Castalia Web `README.md`, `docs/product-boundary.md`, `docs/authority-and-claims.md`, and `docs/verification.md` at base `6852185`

## Peer-review record

Independent peer-review reports and their resolution ledger will be linked here before this RFC can be accepted.
