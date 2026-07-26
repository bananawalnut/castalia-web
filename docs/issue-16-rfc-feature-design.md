# Issue #16 design — RFC and Problem Board exchanges with World Model Trajectories peer review

- Issue: `ZenithResearch/castalia-web#16`
- Design status: In review
- Review posture: Changes requested; acceptance blockers remain
- Scope: Product and integration contract only
- Target repository: `ZenithResearch/castalia-web`
- Engine source: `bananawalnut/world-model-trajectories`
- Pinned engine commit reviewed for this draft: `2508ea2c466633c0d270eedf42f46744120d439e`
- Last updated: 2026-07-25

## Summary

Castalia Web should provide a paired problem board and RFC exchange surface. In Gate 2, people and agents can draft, validate, preview, and export problems, invitations to attack them, RFCs, claims that an RFC addresses one or more problems, challenges, evidence, counterexamples, and revisions. Publication occurs only after a human submits the export and the repository accepts its pull request. WMT can then inspect whether the confirmed formalization of an RFC can hold together, which minimal formalization conflicts exist, which maximal compatible claim subsets remain, and what a proposed revision changes. Human peer review and community decisions remain authoritative.

The minimum useful integration is a repository-backed problem/RFC exchange that can export drafts, solution claims, and reviews for human pull-request submission, paired with a read-only analysis instrument. It does not decide truth, mark a problem solved, approve an RFC, rank reviewers, allocate funds, mutate Matrix state, or execute governance. A model may propose a formalization only in a later, separately authorized phase. The initial path imports human-reviewed typed IR and exposes the natural-language-to-logic seam.

## Objective

A reviewer should be able to:

1. browse a problem board and open an immutable problem revision;
2. draft and export an open or directed invitation for a person or agent to attack, investigate, clarify, or address the problem;
3. draft and export an RFC that explicitly claims to address all or a bounded part of the problem;
4. open a repository-backed RFC revision and traverse its linked problem, solution claim, and exchange thread;
5. inspect each natural-language claim beside its source locator and plain-English back-translation;
6. confirm or reject the formalization before analysis;
7. run WMT locally;
8. inspect consistency, minimal formalization conflicts, maximal compatible claim subsets, and consequences entailed by the confirmed formalization;
9. challenge the RFC, its problem-solution claim, its evidence, or its formalization without erasing minority routes;
10. fork a candidate revision without overwriting the accepted source;
11. submit a peer-review artifact that cites the exact problem and RFC revisions, claim-set digest, engine commit, and analysis result; and
12. leave problem closure, RFC disposition, funding, and governance to the community's separately authorized process.

## Why WMT fits this surface

The reviewed fork already provides the relevant reasoning kernel:

- typed many-sorted first-order IR as JSON;
- deterministic IR-to-English rendering;
- a Rust-to-Wasm engine that emits solver scripts;
- Z3 4.16 in the browser;
- explicit `unknown` handling;
- minimal conflicts, maximal compatible claim subsets, repair candidates, and formal consequences;
- same-claim-ID revision semantics;
- state export/import and forkable trajectory snapshots; and
- defeasible reasoning where a general default may yield to a more specific claim without hiding strict contradictions.

The engine's claim is bounded: consistency of the formalization, not truth, social disagreement, consensus, or faithful natural-language interpretation. Castalia Web must preserve that boundary everywhere.

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

Those last four facts prevent direct reuse of the current site shell. Castalia Web should consume a bounded engine package from the fork, not copy `site/app.js` or embed the existing page. The pinned engine also interpolates user-controlled identifiers and operator strings into SMT-LIB, does not propagate malformed or `unknown` solver output fail-closed through every phase, can emit an unverified conflict-local repair as “optimal,” and does not expose enforceable resource budgets. Gate 0 must fix and test those defects; the pinned commit cannot qualify unchanged.

## Product boundary

### RFC source

An RFC remains a repository-backed artifact with immutable revision identity. The Markdown document is the human source. Its typed claim set is a sidecar bound to the exact document revision by digest.

The WMT view is derived evidence. It cannot silently rewrite the RFC, replace peer-review prose, or become the canonical source of a community decision.

### Peer review

Peer review is a signed or repository-attributed response to an exact RFC revision. It may:

- accept or contest a formalization;
- identify missing claims or source spans;
- propose a claim revision;
- identify a likely human disagreement through attributed prose;
- adopt a computed compatible subset as an attributed human position; or
- state that the solver result is `unknown`, incomplete, or irrelevant to the substantive question.

A WMT analysis can support a review. It cannot constitute a review by itself.

### Authority

This issue design does not change the current Castalia Web authority ledger.

- Matrix remains canonical for Matrix state.
- Castalia Control/Dregg authority remains outside this issue design.
- The repository remains canonical for the RFC revision and checked-in peer-review artifacts in the first slice.
- WMT output is reproducible computational evidence for the supplied formalization, engine, solver, profile, and budgets. It is not an authority source.
- Humans and the community's accepted process remain authoritative for formalization acceptance, RFC disposition, and every consequential action.

## Paired problem board and RFC exchange model

The problem board and RFC collection are two views over one repository-backed exchange graph.

- A **Problem** states something worth attacking, investigating, or solving.
- An **RFC** proposes a mechanism, design, experiment, or intervention.
- A **ProblemSolutionClaim** states that one exact RFC revision claims to solve all or a bounded part of one exact problem revision.
- An **ExchangeEntry** lets a person or agent request an attack, answer a request, critique a claim, add evidence, provide a counterexample, rebut, clarify, revise, endorse, or preserve dissent.
- A **DecisionRecord** may change repository lifecycle state after the authorized process runs.

The relation between problems and RFCs is many-to-many. A problem may have competing RFCs. One RFC may claim to solve several problems. The link is a first-class reviewable claim, not a tag and not proof of solution.

### `ProblemEntryV1`

Required fields:

- `schema_version`: exactly `castalia.problem.v1`;
- stable `problem_id`, immutable `problem_revision`, canonical repository-authority ID, canonical path, commit SHA, and canonical content digest excluding self-digest fields;
- `title`, exact problem `statement`, context, scope, constraints, known evidence, counterevidence, open questions, and explicit success or falsification criteria;
- authors and submitter attribution, with human/agent/model-assistance disclosure;
- ontology tags plus authored forward semantic references; and
- visibility and sensitivity classification.

The immutable problem revision contains no mutable status, backreference, attention, exchange, or decision arrays. Generated indexes derive those projections. Problem state has separate dimensions: `disposition` is `draft`, `open`, `closed`, `withdrawn`, or `superseded`; `assessment` is `unassessed`, `under_investigation`, `contested`, or `solved_under_criteria`; and candidate-solution count, unanswered calls, unresolved counterexamples, and dormancy are derived attention facets. Only an authorized decision record may change disposition or assessment after initial draft creation. A `solved_under_criteria` decision must cite the exact criteria, evidence, RFC revisions, unresolved counterevidence, and preserved dissent. “Solved” never means universally or finally true.

### `RfcMetadataV1`

Every RFC adds stable identity, title, summary, content-author attribution, immutable revision identity `(repository_authority_id, commit_sha, canonical_path, content_digest)`, parent revision, and authored dependency references. Mutable lifecycle, review, exchange, decision, solution-claim, and backlink projections are excluded. An RFC may exist without a problem-solution claim, but the UI must make that absence explicit.

### `ProblemSolutionClaimV1`

Required fields:

- stable `solution_claim_id`;
- immutable `solution_claim_revision`, `solution_claim_digest`, canonical repository-authority ID, canonical path, commit SHA, and optional same-ID `supersedes` revision;
- exact `problem_id`, `problem_revision`, and problem digest;
- exact `rfc_id`, `rfc_revision`, and RFC digest;
- `coverage`: `full` or `partial`;
- `approach_role`: `direct_solution`, `prerequisite`, `mitigation`, `experiment`, or `counterproposal`;
- precise claim statement explaining how the RFC addresses the problem;
- criterion-ID-bound criteria addressed and not addressed, mechanism, evidence, assumptions, limitations, risks, and falsifiers;
- submitter attribution and model-assistance/conflict-of-interest disclosures;
- authored evidence references only.

Solution-claim state is a generated projection, never a mutable field in the claim revision. `disposition` is `submitted`, `withdrawn`, or `superseded`; `assessment` is `unreviewed`, `under_review`, `contested`, `partially_supported`, `supported_under_criteria`, or `rejected_under_criteria`. The RFC author may create an immutable claim or submit a withdrawal request but cannot set a projected status or make the problem solved. Assessed status requires policy-defined review evidence and an authorized decision record. WMT analysis of the RFC cannot determine either status.

### `ExchangeEntryV1`

Every exchange is append-only and addressable. Required fields:

- stable globally scoped `exchange_id`, immutable revision/digest, canonical repository-authority ID, canonical path, commit SHA, and idempotency key;
- separate content authors, submitter, committer, signer, automation/model assistance, optional represented principal, authorization-evidence, and community-standing-snapshot references;
- immutable `thread_id`, one `root_subject_ref`, zero-or-one `parent_exchange_ref`, and typed related-artifact references;
- `kind`: `problem_call`, `specialist_invitation`, `request_attack`, `request_clarification`, `critique`, `counterexample`, `evidence`, `rebuttal`, `clarification`, `comment`, or `dissent`;
- `request_mode: open | directed`, structured inert `requested_actor_refs`, and explicit requested next action for request kinds;
- prose body, cited source locators, evidence/artifact references, and explicit requested next action;
- `responds_to`, `supersedes`, immutable resolution/tombstone references, and preserved-dissent fields.

An exchange is a message only. It may reference but never recreate a solution claim, candidate RFC revision, review, resolution, withdrawal, endorsement, decision, or tombstone. Parent and child share one thread root. `supersedes` is an acyclic same-author correction edge and never hides the prior entry. Generated request state is `open`, `acknowledged`, `answered`, `declined`, `withdrawn`, or `superseded`; acknowledgement and decline are voluntary response events and create no assignment, obligation, endorsement, standing, or authority. Generated exchange disposition is `open`, `resolved`, `withdrawn`, `superseded`, or `tombstoned`. Resolution and moderation are separate immutable artifacts; an exchange never rewrites itself to claim resolution.

Inviting a named person or agent to attack a problem is routing, not assignment or endorsement. Recipient references are inert data, never active mentions. An agent entry must not bind or be attributed to a principal unless independently verifiable delegation evidence binds principal identity, agent identity, repository authority, permitted entry kinds/targets, validity interval, and revocation state. Verification fails closed at ingestion. Otherwise the UI says “self-declared agent; no principal authority established.” No agent may claim human identity, reviewer independence, community standing, or decision authority through Git attribution alone.

### Exchange invariants

1. Every entry binds immutable target revisions; later edits create superseding entries.
2. Critiques, counterexamples, and dissent remain traversable after resolution.
3. A solution claim never auto-closes a problem.
4. An RFC recommendation never becomes a decision record.
5. Computed WMT conflicts never become attributed social disagreement without a human/agent exchange entry adopting that interpretation.
6. Funding, bounties, voting, treasury execution, assignment, and contributor standing are separate future authority artifacts.
7. The board supports neutral views for open calls, requests needing attack, unanswered specialist invitations, competing RFCs, contested solution claims, unresolved counterexamples, and dormant problems.

### Web routes

- `/problems` — problem board with neutral status/attention views;
- `/problems/new` — submit a problem draft;
- `/problems/:problemId` — problem revision, criteria, exchanges, and candidate RFCs;
- `/problems/:problemId/respond` — submit an exchange or RFC solution claim;
- `/rfcs` — browse RFCs and lifecycle state;
- `/rfcs/new` — submit an RFC draft, optionally claiming to solve problems;
- `/rfcs/:rfcId` — RFC, formalization, linked problems, exchanges, reviews, dissent, and WMT analysis;
- `/rfcs/:rfcId/review` — submit an attributed review, exchange, or candidate revision.

Until authenticated repository submission exists, these routes remain visible-unavailable or export a reviewed artifact for human PR submission. They do not collect credentials or imply a successful repository mutation.

### Canonical repository structure

One repository belongs to one community or authority boundary and contains many problems and RFCs:

```text
community-rfcs/
├── README.md
├── rfc-repository.json
├── schemas/
│   ├── problem.schema.json
│   ├── rfc-metadata.schema.json
│   ├── actor-attribution.schema.json
│   ├── problem-solution-claim.schema.json
│   ├── exchange-entry.schema.json
│   ├── rfc-claim-set.schema.json
│   ├── rfc-formalization-review.schema.json
│   ├── wmt-ingest.schema.json
│   ├── rfc-analysis-semantic.schema.json
│   ├── rfc-analysis-execution.schema.json
│   ├── rfc-peer-review.schema.json
│   ├── resolution.schema.json
│   ├── tombstone.schema.json
│   ├── artifact-index.schema.json
│   └── decision.schema.json
├── policies/
│   ├── lifecycle-policy.json
│   ├── formalization-review-policy.json
│   ├── reviewer-attribution-policy.json
│   ├── logic-profiles/
│   └── budget-profiles/
├── actors/
│   └── ACTOR-0001.json
├── problems/
│   └── PROB-0001/
│       ├── problem.md
│       └── metadata.json
├── rfcs/
│   └── RFC-0001/
│       ├── rfc.md
│       ├── metadata.json
│       ├── claims.json
│       ├── formalization-reviews/
│       ├── analyses/semantic/
│       ├── analyses/executions/
│       ├── peer-reviews/
│       └── resolutions/
├── solution-claims/
│   └── PSC-0001.json
├── exchanges/
│   └── EX-0001.json
├── decisions/
│   └── DR-0001.json
├── indexes/
│   ├── problem-rfc-links.json
│   ├── exchange-targets.json
│   └── lifecycle-state.json
├── fixtures/
│   ├── valid/
│   └── invalid/
└── .github/workflows/verify-rfcs.yml
```

Git is the revision system. Substantive changes use branches and pull requests; repositories do not duplicate every revision into extra folders. Problems and RFCs own their source documents and local sidecars. Multi-target artifacts—solution claims, exchanges, and decisions—have exactly one canonical top-level file. Generated indexes provide the bidirectional problem/RFC and exchange-target projections and must be reproducible from canonical artifacts. CI rejects duplicate IDs, conflicting files, stale indexes, missing targets, target-digest mismatches, forbidden reference cycles, and references to revisions that do not exist in Git history.

## Proposed artifact contracts

The schemas below are normative field sets for later JSON Schema work. They are not implemented by this issue design.

### `RfcClaimSetV1`

This is the provenance envelope. It is never passed directly to `WmtEngine.ingest`.

Required fields:

- `schema_version`: exactly `castalia.rfc-claim-set.v1`;
- `rfc_id`: stable RFC identifier;
- `rfc_revision`: immutable repository commit or content-addressed revision identifier;
- `rfc_digest`: digest of the exact canonical RFC bytes;
- `claim_set_digest`: digest of the canonical claim-set bytes excluding this field;
- `engine_target`: owned fork URL plus exact commit;
- `logic_profile`: exactly `castalia.strict-unweighted.v1` in the first slice;
- `sorts`, `predicates`, and `functions`: explicitly declared typed vocabulary;
- `claims`: ordered claims with Castalia provenance; and
- `formalization_review_policy_id` plus immutable formalization-review references.

Each claim contains stable `id`, exact natural-language `source`, `source_locator`, typed `formula`, plain-English `back` translation, and review references. First-slice claims are active, strict, and unweighted. No `weight`, `defeasible`, inferred declaration, or ranked repair is accepted.

`formalization_status` is a derived projection, not an author-controlled claim field. `RfcFormalizationReviewV1` records reviewer attribution, exact claim-set digest, per-claim disposition, source-coverage attestation, missing-claim findings, vocabulary/IR review, rationale, timestamp, conflict-of-interest disclosure, model-assistance disclosure, and immutable repository evidence. The first repository policy requires two distinct GitHub review identities, at least one who did not author the claim set, no unresolved per-claim contest, explicit source-coverage confirmation, and exact typed-IR inspection. This proves only `confirmed_under_repository_policy`; it does not prove community standing.

Claim-set readiness is derived as `unreviewed`, `partially_reviewed`, `contested`, or `confirmed_under_repository_policy`. Exploratory analysis may run before confirmation, but it cannot support a formalization or RFC disposition and cannot receive an unqualified coherent status.

### `WmtIngestV1`

Castalia deterministically projects a validated claim envelope to WMT's exact input shape:

```json
{
  "sorts": [],
  "preds": [],
  "funcs": [],
  "claims": []
}
```

The projection strips Castalia-only metadata and maps `predicates` to `preds` and `functions` to `funcs`. Before projection it rejects unknown fields, duplicate claim IDs, duplicate or conflicting declarations, namespace collisions, undeclared symbols, unsupported sorts/operators, free variables, invalid arity, unsupported weights/defaults, and any identifier outside the closed lexical profile. The exact canonical projected bytes and their domain-separated digest are bound into the analysis.

The first logic profile permits Boolean values, explicitly declared uninterpreted sorts, constants, predicates, equality, negation, conjunction, disjunction, implication, biconditional, and bounded universal/existential quantification. Arithmetic operators, raw real literals, auto-declaration, defeasible reasoning, weights, and repair ranking are deferred. Every user symbol is encoded to compiler-owned identifiers; no user string is interpolated as SMT-LIB.

### `RfcAnalysisSemanticV1`

This deterministic artifact contains:

- exact RFC, claim-set, projected-input, engine, solver-artifact, logic-profile, and budget digests;
- formalization readiness and excluded claim IDs/reasons;
- status: `compatible`, `formalization_conflict`, `unknown`, `invalid`, `enumeration_capped`, `timeout`, `cancelled`, or `resource_exhausted`;
- minimal formalization conflicts found;
- maximal compatible claim subsets found;
- whether enumeration is exhaustive; and
- consequences entailed by this formalization under this logic profile, each bound to its minimal witness claim IDs.

It contains no timestamps or runtime telemetry. Canonical JSON and hash algorithms must be selected and test-vectored before acceptance. Browser-generated output is unverified derived evidence even when self-digested. It becomes verified computational evidence only after a locked CI job independently regenerates the same semantic bytes from reviewed source and signed release provenance.

The first slice emits no repair suggestion. A later contract may emit a conflict-local candidate or solver-verified global minimum-weight hitting set, but must state scope, verified restoration, whether optimality is proven, and whether the conflict collection was exhaustive.

### `RfcAnalysisExecutionV1`

This nondeterministic envelope binds one semantic-result digest to start/end timestamps, supported-device profile, limits applied, stop reason, solver-call count, and bounded performance telemetry. It is not included in the semantic-result digest.

### `RfcPeerReviewV1`

Required fields include review ID; declared author identity; repository URL; immutable commit SHA or pull-request review ID; author-versus-committer distinction; signature-verification state; exact RFC/claim-set bindings; optional verified analysis digest; cited claims/locators; rationale; model-assistance and conflict-of-interest disclosures; and optional candidate-revision reference.

Individual dispositions are `comment`, `request_revision`, `recommend_approve_formalization`, `recommend_reject_formalization`, `recommend_approve_rfc`, and `recommend_reject_rfc`. Only a separate repository decision record created by the authorized community RFC maintainer can transition a feature RFC's status. Git attribution is provenance only: **Git-attributed; community standing not established.**

Reviews also carry `responds_to`, `supersedes`, `status`, `resolution`, `resolution_rationale`, and `preserved_as_dissent`. Computed compatible subsets remain separate from attributed human positions. Accepted RFCs retain unresolved and preserved dissent with neutral ordering; no computed subset or human position is ranked or called defeated without an authorized governance artifact.

## Integration architecture

```text
Repository-backed RFC Markdown + typed claim sidecar
        + problem + solution claim + exchanges
                    |
                    v
        Castalia contract validation
  digest binding / schema / source locators
                    |
                    v
 credentialless analysis origin + sandboxed frame
  pinned WMT core + Z3 inside bounded workers
                    |
                    v
      deterministic local analysis
 conflicts / compatible subsets / witnesses
                    |
                    v
       non-authoritative review UI
                    |
                    v
 explicit export of analysis + peer-review artifact
        (no automatic upstream mutation)
```

### Dependency boundary

The WMT fork must first produce an embeddable, versioned browser-engine release. That prerequisite must:

1. expose the Wasm facade and Z3 driver behind one documented worker-safe adapter with a closed input grammar;
2. publish JSON schemas or generated types for inputs and outputs;
3. include licenses for WMT, Z3, and the isolation shim;
4. publish signed provenance binding source tree, lockfiles, pinned Rust/wasm-pack/Z3/npm toolchains, build commands, SBOM, licenses, every JavaScript/Wasm/worker digest, reproducible-build comparison, and test evidence;
5. parse exact bounded solver replies and preserve `unknown`, malformed, timeout, cancellation, and enumeration-cap states through every driver phase without emitting partial semantic results;
6. contain no UI, OpenRouter call, API-key storage, or implicit persistence; and
7. run native and real-browser conformance tests before release;
8. encode compiler-owned SMT identifiers and reject raw solver text, unsupported operators, duplicate names, collisions, free variables, and undeclared vocabulary; and
9. remove eager powerset repair allocation and every unverified repair fallback from the package path.

Castalia Web then pins the exact fork commit and artifact digests. It must not track a mutable branch, download code at runtime from GitHub, or copy unversioned generated Wasm into this repository without provenance.

### Analysis origin, worker, and browser isolation

A worker provides responsiveness and cancellation, not security containment. The first slice must run on a dedicated credentialless analysis origin inside a sandboxed frame with a narrowly validated `postMessage` protocol. That origin receives no Matrix, repository-write, wallet, provider, review, or application-session credential. Its CSP sets `connect-src 'none'`, narrows `worker-src` and script hashes, enables Trusted Types, and forbids navigation, forms, downloads except explicit reviewed export, and ambient same-origin access.

Within that origin, solver work runs in bounded workers. The adapter serializes one Z3 session per analysis, supports cancellation by terminating the entire worker tree, discards every unfinished result, and proves that a fresh worker succeeds after cancellation or crash.

Gate 0 includes a runnable Vite production spike proving module-worker import, nested Z3 pthread workers, asset paths, production COOP/COEP headers, page and worker `crossOriginIsolated`, cancellation and context release, fresh-worker recovery, and the declared Chromium/Firefox/Safari support matrix. The production path prohibits the current service-worker isolation shim.

### First-slice security ceilings

The first contract applies these hard ceilings; supported-device profiles may only lower them:

- 256 KiB raw claim-set bytes before parsing;
- 32 claims, 128 declarations, 4,096 aggregate formula nodes, 256 nodes per formula;
- 64-character ASCII identifiers encoded to compiler-owned symbols;
- 8 KiB per source/back-translation/review string;
- formula depth 32, quantifier depth 2, arity 8;
- 512 cumulative solver calls, 1 second per solver query, and 12 seconds wall time;
- 64 reported conflicts, 64 compatible subsets, 1 MiB semantic output;
- one analysis worker tree per tab and two concurrent analysis origins per browser profile.

Every limit is checked before expanded allocation where possible, then between solver rounds. A breach terminates the worker tree and returns only its typed stop reason. Device adaptation cannot raise a ceiling. Gate 0 must test and calibrate usefulness under these ceilings before acceptance; changing them later creates a versioned profile.

### Persistence

The first slice is public-RFC-only and memory-only until the user explicitly previews and exports an artifact. It rejects Matrix-origin text and private-repository fetching. It does not use `localStorage`, `sessionStorage`, cookies, IndexedDB, service workers for data persistence, telemetry, diagnostics logging, browser caches for RFC data, or automatic uploads.

A clear/reset action terminates the worker tree, drops references, revokes object URLs, and removes generated exports. Navigation, reload, cancellation, crash, clear, and export paths must be tested with storage and network inspection. A later private-content or persistence RFC must define authorization evidence, redaction, encryption, retention, cache, export, clipboard, incident, and deletion behavior. WMT's existing local trajectory tree is a product reference, not reusable persistence authority.

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

### Problem board and exchange

The board card shows the exact problem revision, status, scope, success/falsification criteria, open requested actions, unanswered directed invitations, candidate RFC count, contested solution-claim count, and unresolved counterexample count. It does not rank by likes, author identity, solver compatibility, or unqualified “best solution.”

The problem detail surface keeps three concepts visually separate:

1. **Problem definition** — source, criteria, scope, evidence, and current decision record.
2. **Candidate RFCs** — each linked through an explicit full/partial/prerequisite/mitigation/experiment/counterproposal claim.
3. **Exchange** — addressable calls, invitations, responses, critiques, evidence, counterexamples, rebuttals, revisions, endorsements, and dissent.

Submission begins by choosing exactly one artifact type: problem, RFC, problem-solution claim, exchange, formalization review, peer review, or candidate revision. The form explains the authority of that artifact and requires a target revision wherever applicable. Choosing RFC allows optional problem-solution claims but never preselects `full` scope. Choosing an invitation requires a requested action and makes “invitation—not assignment or endorsement” persistent copy.

Human-authored, agent-authored, and agent-assisted entries have distinct text labels in every card, detail, export, and accessible name; color or avatar alone is insufficient. Thread order defaults to repository chronology with explicit response edges. Neutral filters do not hide unresolved critiques or dissent and do not convert activity counts into quality scores.

### WMT analysis

The first review surface should show five layers in order:

1. **Source** — exact RFC revision and digest.
2. **Formalization** — source sentence, source locator, back-translation, status, and reviewer evidence.
3. **Analysis** — compatible, formalization conflict, unknown, invalid, capped, timed out, cancelled, or resource exhausted with full profile/provenance.
4. **Computed structure** — minimal formalization conflicts, maximal compatible claim subsets, and consequences entailed by this formalization under this logic profile.
5. **Human decision** — peer-review controls that make clear no solver result chooses the RFC disposition.

Required language:

- “Consistency of the confirmed formalization, not truth or community consensus.”
- “Computed compatible subsets are not human or minority positions.”
- “Unknown is not consistent.”
- “This analysis does not approve, reject, fund, or execute the RFC.”

Every result view and export displays formalization readiness, exclusions, logic profile, completeness, limits, engine/solver identity, and the non-truth/non-consensus warning. The UI must never use green/coherent styling to imply truth, consensus, governance approval, or funding eligibility.

WCAG 2.2 AA is normative. Every graph has a complete text/table alternative. All controls are keyboard operable with visible focus and logical headings; status never relies on color; long identifiers have accessible names; focus is restored after completion/cancellation; live regions announce running, complete, failed, cancelled, unknown, and capped states without repetition. Verification includes zoom/reflow, reduced motion, high contrast, and representative screen-reader coverage.

## Privacy and security requirements

- Accept public repository-backed RFC text only. Reject Matrix-origin text, private repository fetching, and cross-route transfer into analysis.
- Treat every problem, RFC, solution claim, exchange, actor record, link, and generated index as untrusted input. Enforce schema-specific byte/count/depth limits before rendering, indexing, projection, or graph traversal.
- Store each canonical artifact at exactly one schema-defined path. Validate ID/path agreement, immutable target digests, idempotency keys, signature state, actor references, and generated-index equality in CI. Never auto-fetch a cross-repository reference; require a repository-policy allowlist plus a digest-bound local evidence snapshot.
- Actor identity, `acting_for`, and community standing are separate claims. An agent may name a principal only with an explicit authorization-evidence reference accepted by repository policy; otherwise display “self-declared agent; principal authority not verified.”
- Directed invitations are opt-in routing requests. They do not create assignments, obligations, endorsements, direct notifications, or public claims about the target. Live notification requires verified target identity, recipient preferences, rate limits, anti-replay controls, abuse reporting, and repository moderation policy.
- Reject secrets, credentials, private-room material, doxxing, and unsupported sensitive-data classes before export. Git permanence must be shown before submission. A moderation/redaction decision creates a content-addressed tombstone that preserves graph integrity and decision provenance without redisplaying removed content; history rewriting is a separately authorized incident procedure.
- Bind every result to exact RFC bytes, claim-set bytes, projected WMT bytes, logic profile, all budgets/options, engine and solver artifact hashes, and solver version.
- Reject digest mismatch, schema mismatch, duplicate claim IDs, conflicting vocabulary declarations, invalid source locators, and unsupported engine versions before solver startup.
- Disable auto-declaration. Reviewable and exploratory claim sets declare vocabulary explicitly and pass the same closed lexical/type profile.
- Enforce the first-slice security ceilings before expanded allocation and at every solver phase.
- Parse an exact bounded output grammar for each Z3 command. Missing, duplicate, trailing, malformed, unexpected, error, or `unknown` responses terminate the operation without recording a conflict, compatible subset, witness, or compatibility verdict from that response.
- Render every artifact-controlled value as a text node. Disable raw Markdown HTML; allowlist link schemes and repository hosts; sanitize generated SVG; prohibit untrusted `innerHTML`/`dangerouslySetInnerHTML`; enforce strict CSP and Trusted Types.
- Keep solver scripts and result internals out of logs unless a reviewer explicitly exports a redacted diagnostic artifact.
- Do not store provider keys, wallet material, Matrix tokens, capabilities, or review credentials in WMT state.
- Scan shipped browser artifacts and dependency/import graphs for credentials, model clients, persistence APIs, and network endpoints; enforce no-network behavior at runtime.
- Preserve WMT and Z3 license notices in distributions.

## Failure semantics

| Condition | Required behavior |
| --- | --- |
| RFC, claim-set, projected-input, profile, budget, engine, or artifact digest mismatch | Reject before analysis. |
| Unconfirmed formalization | Mark analysis exploratory; block approval based on it. |
| WMT ingest error | Show `invalid` with bounded diagnostics. |
| Genuine Z3 `unknown` | Show `unknown`; stop the current operation with no semantic result from later phases. |
| Parse/type/protocol/malformed solver output | Show `invalid`; terminate and discard partial output. |
| Enumeration limit reached | Show `enumeration_capped`; reported sets are real but partial and cannot support exhaustive claims. |
| Timeout, cancellation, resource breach, or worker crash | Terminate the complete worker tree, discard partial output, return the distinct typed reason, and permit explicit retry in a fresh worker. |
| Engine/artifact digest mismatch | Fail closed before loading Wasm. |
| Cross-origin isolation unavailable | Show analysis unavailable; do not fall back to remote execution. |
| Proposed model formalization in first slice | Reject as unsupported; preserve manual/import path. |
| A reviewer proposes a changed claim set | Require a new candidate RFC revision; never mutate the source in place. |
| Missing target revision, digest mismatch, duplicate ID, stale index, replayed idempotency key, or invalid reference cycle | Reject the artifact before it enters the board or exchange graph. |
| Agent claims to act for a principal without accepted authorization evidence | Preserve the self-declared agent attribution but remove the represented-principal claim and block standing/authority inferences. |
| Invitation target has not opted in or live notification controls are unavailable | Record only a non-notifying open call; do not contact or assign the target. |
| Artifact contains prohibited sensitive content or is covered by an authorized moderation/redaction decision | Reject before export or render the digest-bound tombstone; never silently erase graph edges. |

## Delivery sequence

### Gate 0 — fork packaging prerequisite

Owned by `bananawalnut/world-model-trajectories`.

- Fix the SMT compiler, solver-response handling, result semantics, and resource model before packaging.
- Complete the runnable Vite/credentialless-origin/worker feasibility spike and supported-browser matrix.
- Define the embeddable worker adapter, exact projection, schemas, and versioned security ceilings.
- Remove site UI, OpenRouter, and persistence from the package boundary.
- Publish signed provenance, reproducible-build evidence, SBOM, licenses, artifact digests, native tests that fail when pinned Z3 is absent/wrong, and browser conformance evidence.
- Prove fork/upstream relationship and update policy.

Stop if the fork cannot produce reproducible pinned artifacts without importing the static site shell, cannot eliminate SMT injection and phase-level fail-open behavior, or cannot prove the credentialless-origin/worker topology.

### Gate 1 — Castalia contracts and fixtures

Owned by `ZenithResearch/castalia-web`.

- Add canonical JSON Schemas and generated TypeScript for claim sets, formalization reviews, projected WMT input, deterministic semantic output, execution envelopes, peer reviews, and repository decision records.
- Add canonical JSON Schemas and generated TypeScript for problems, RFC metadata, problem-solution claims, exchanges, and problem/RFC lifecycle decisions.
- Add positive and hostile fixtures for projection, digest binding, status handling, duplicate IDs, conflicting declarations, undeclared vocabulary, SMT tokens, unknown/invalid/limit states, and source locators.
- Add graph fixtures for many-to-many solution claims, immutable target revisions, actor/principal separation, exchange replies/supersession, stale indexes, broken links, duplicate IDs, replay, forbidden cycles, tombstones, and problem/RFC lifecycle decisions.
- Keep all routes fixture-only and network-free.

### Gate 2 — minimum useful review slice

- Browse and inspect repository-backed public problem and RFC fixtures.
- Create a problem, RFC, solution claim, exchange, or review draft and export it for human pull-request submission.
- Show human and agent attribution, target revision, requested next action, competing RFCs, critiques, counterexamples, and preserved dissent.
- Load the pinned package in the credentialless analysis origin and bounded workers.
- Use repository-backed public RFCs and checked-in reviewed claim sets.
- Provide strict, unweighted, accessible conflict, compatible-subset, and witness views with exploratory/confirmed separation.
- Export an attributed review recommendation and an unverified analysis artifact; never mutate the source.
- Bind candidate revisions to parents and require human action to submit or merge them.
- Prove no persistence, no network, no credentials, cancellation, limits, unknown, invalid, timeout, cap, and recovery behavior.
- Validate two realistic RFC fixtures: one where a formalization conflict helps review and one where analysis correctly adds no substantive value.
- Run moderated reviewer evaluation for usefulness and truth/consensus misconceptions. Human source/formalization inspection and ordinary review remain usable when analysis is unavailable.

### Gate 3 — verified regeneration and repository lifecycle

- Independently regenerate deterministic semantic artifacts in locked CI before labeling them verified computational evidence.
- Use repository/PR attribution only and display that community standing is not established.
- Require an authorized repository decision record for every RFC state transition and preserve unresolved dissent.
- Keep browser submission export-only until a separate live-mutation contract proves repository authentication, least-privilege writes, idempotency, review branches, moderation/redaction, spam/Sybil controls, notification consent, audit, and fail-closed recovery.

### Gate 4 — optional assisted formalization

Deferred. Requires its own accepted privacy, provider, credential, and authority contract.

## Verification plan

The implementation issue train must include:

- an end-to-end repository fixture where a proof-system hardness problem is opened, a non-notifying specialist invitation requests an attack, a human-authored and an agent-authored response remain distinguishable, an RFC submits a bounded solution claim, a counterexample contests it, a candidate revision responds, and only a final decision artifact changes problem/RFC assessment state;
- graph round-trip tests proving one canonical solution claim and exchange can be discovered from both problem and RFC views without duplicate storage;
- native WMT tests that require the exact pinned Z3 version;
- signed provenance, reproducible-build, SBOM, artifact-digest, license, and vulnerability checks;
- production-built credentialless-origin and nested-worker browser conformance;
- RFC-envelope projection tests that preserve explicit vocabulary and reject unknown fields, duplicate IDs, collisions, undeclared symbols, unsupported grammar, and SMT tokens;
- phase-by-phase injection of `unknown`, errors, malformed, missing, duplicate, and trailing solver replies, each proving no verdict or partial result escapes;
- large-input/deep-nesting/resource tests proving no eager powerset allocation or worker storm;
- cap, timeout, cancellation, crash, and resource-breach tests proving partial output is discarded and fresh-worker retry succeeds;
- strict-mode consequence/witness fixtures bound to the exact effective claim set;
- deterministic repeated semantic-result bytes across browser and locked-CI regeneration;
- no-network, no-credential, no-telemetry, clear/reset, and no-persistence browser tests;
- hostile XSS fixtures for every string, Markdown, URL, locator, SVG, import, export, ID, and filename surface;
- bundle endpoint, dependency allowlist/import-graph, and secret scans;
- WCAG 2.2 AA, text alternatives, keyboard, live-region, zoom/reflow, reduced-motion, high-contrast, and screen-reader checks;
- exact copy checks for the non-authoritative claim boundary; and
- independent exact-head technical, security/privacy, and product/governance reviews.

## Acceptance criteria for the Issue #16 design

The Issue #16 design is ready for implementation decomposition only when:

- Gate 0's source fixes, reproducible release, and runnable browser topology pass; maintainer confirmation alone is insufficient;
- technical review confirms the proposed contracts map to actual WMT behavior;
- security/privacy review finds no unresolved high-severity issue;
- product/governance review confirms solver evidence cannot masquerade as peer review or authority;
- the current Castalia authority ledger is not broadened;
- problem, RFC, solution-claim, and exchange schemas preserve the many-to-many graph and prohibit self-asserted solution/decision status;
- every peer-review finding is resolved, explicitly deferred with an owner/gate, or preserved as minority dissent; and
- the authorized Castalia Web repository maintainer explicitly approves the issue/PR design boundary.

Design approval authorizes implementation issue decomposition. It does not authorize implementation, merge, deployment, model calls, credentials, Matrix access, or governance actions.

## Community RFC lifecycle

The repository lifecycle is `Draft → In Review → Accepted | Rejected | Withdrawn → Superseded`. A substantive RFC, claim-set, profile, or budget change creates a new immutable revision, marks earlier analyses stale, and resets affected review readiness.

The community RFC repository maintainer may create a repository decision record that transitions a feature RFC's repository status after required reviews. That decision does not establish broader community governance approval. Every decision record names the actor, authority scope, source revision, required reviews, unresolved or preserved dissent, rationale, timestamp, and immutable repository evidence. A merged status-header edit without that record has no transition effect.

## Remaining acceptance decisions

1. Select and test-vector the canonical JSON and domain-separated hash algorithms.
2. Confirm the dedicated credentialless analysis origin and production COOP/COEP deployment target through Gate 0.
3. Calibrate the fixed security ceilings against supported devices without raising them in the current profile.
4. Define the community RFC maintainer policy and repository evidence required for feature RFC decisions.
5. Confirm the canonical repository structure specified in this revision or record an explicit replacement decision.

## Explicit non-claims

This issue design does not prove or authorize:

- truth, factual accuracy, community consensus, RFC acceptance, reviewer standing, funding eligibility, or governance validity;
- natural-language-to-logic faithfulness without human review;
- exhaustive analysis when an enumeration or resource limit is reached;
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
- `https://x.com/DreggNet/status/2081060089079746851` as the user-specified canonical example for RFC exchange behavior; exact post text was not retrievable because the official API returned `CreditsDepleted` and the public fallback was denied, so this issue design does not invent or quote it
- `https://x.com/DreggNet/status/2080506484304072910` as the canonical problem-board routing example: “hi @math__street it would be really meaningful if you could attack the hardness of approximate query / search based proof systems.” Expanded through a public mirror after the official API returned `CreditsDepleted`; the original X URL remains canonical

## Peer-review record

See the [Issue #16 feature-design peer-review record](issue-16-rfc-feature-review.md). All focused independent reviews requested changes. The issue and PR remain open and in review until the recorded blockers and remaining decisions are closed and freshly reviewed.
