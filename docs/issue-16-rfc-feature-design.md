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
11. draft and export a peer-review artifact that cites the exact problem and RFC revisions, claim-set digest, engine commit, and analysis result; and
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
- An **ExchangeEntry** lets a person or agent request an attack, answer a request, critique a claim, add evidence, provide a counterexample, rebut, clarify, comment, or preserve dissent. It may discuss or reference canonical candidate-revision, endorsement/review, resolution, and decision artifacts but never recreates them.
- A **DecisionRecord** may change repository lifecycle state after the authorized process runs.

The relation between problems and RFCs is many-to-many. A problem may have competing RFCs. One RFC may claim to solve several problems. The link is a first-class reviewable claim, not a tag and not proof of solution.

### Reference and external-source envelopes

`ArtifactRevisionRefV1` binds `repository_authority_id`, artifact kind, globally scoped ID, immutable revision, commit SHA, canonical path, and content digest. `LocalCanonicalRefV1` uses that complete shape and must resolve under repository CI. Reusing an ID with different bytes fails closed; replaying identical bytes is idempotent and creates no second artifact or notification.

`ExternalCitationRefV1` contains canonical URL, source/platform ID when available, captured-at time, retrieval method, optional captured-byte digest, and `verification_status: unavailable | partial | mirror_transcribed | canonical_verified`. It is always visibly untrusted, never auto-fetched, never grants authority or changes lifecycle, and uses allowlisted schemes without remote embeds.

`ExternalExchangeSourceV1` wraps an external exchange example without inventing unavailable content. It adds retrieval attempts, `content_status`, optional verified body bytes, author-identity verification state, and semantic-classification state. When content is unavailable, body, intent, actor attribution, and exchange kind remain unset. The inaccessible DreggNet example is therefore a source-only unresolved record, not evidence for a specific exchange semantic.

`ActorAttributionV1` separately records content authors, submitter, committer, signer, automation/model assistance, declared repository identity, verified repository identity, optional represented principal, delegation evidence, invitees, and community-standing authority snapshot. Standing and delegation are verified projections from named authority evidence, never self-authored fields.

### `ProblemEntryV1`

Required fields:

- `schema_version`: exactly `castalia.problem.v1`;
- stable `problem_id`, immutable `problem_revision`, canonical repository-authority ID, canonical path, commit SHA, and canonical content digest excluding self-digest fields;
- `title`, exact problem `statement`, context, scope, constraints, known evidence, counterevidence, open questions, and stable criterion IDs for explicit success or falsification criteria;
- authors and submitter attribution, with human/agent/model-assistance disclosure;
- ontology tags plus authored forward semantic references using canonical directions only; and
- visibility and sensitivity classification.

The immutable problem revision contains no mutable status, backreference, attention, exchange, or decision arrays. Generated indexes derive those projections. Problem `disposition` is `draft`, `open`, `closed`, `withdrawn`, or `superseded`; decision-backed `assessment` is `unassessed` or `solved_under_criteria`; and `under_investigation`, `candidate_solutions`, `contested`, unanswered calls, unresolved counterexamples, and dormancy are derived attention facets. Only an authorized decision record may change disposition or assessment after initial draft creation. A `solved_under_criteria` decision must cite the exact criterion IDs, evidence, RFC revisions, unresolved counterevidence, and preserved dissent. “Closed” never implies solved, and “solved under criteria” never means universally or finally true.

Problem relations use one authored direction: `broader_problem_refs`, `prerequisite_problem_refs`, `supersedes_problem_ref`, and symmetric `related_problem_refs` stored once under canonical ID ordering. Narrower/dependent/superseded-by relations are generated. Broader/prerequisite/supersession graphs are acyclic and every endpoint binds an exact revision.

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

Solution-claim state is a generated projection, never a mutable field in the claim revision. Decision-backed `disposition` is `submitted`, `withdrawn`, or `superseded`; decision-backed `assessment` is `unreviewed`, `partially_supported`, `supported_under_criteria`, or `rejected_under_criteria`; and `under_review` plus `contested` are derived attention facets. The RFC author may create an immutable claim or submit a withdrawal request but cannot set a projected status or make the problem solved. Assessed status requires policy-defined review evidence and an authorized decision record citing exact criterion IDs. WMT analysis of the RFC cannot determine either status.

### `ExchangeEntryV1`

Every exchange is append-only and addressable. Required fields:

- stable globally scoped `exchange_id`, immutable revision/digest, canonical repository-authority ID, canonical path, commit SHA, and idempotency key;
- separate content authors, submitter, committer, signer, automation/model assistance, optional represented principal, authorization-evidence, and community-standing-snapshot references;
- immutable `thread_id`, one `root_subject_ref`, zero-or-one `parent_exchange_ref`, and typed related-artifact references;
- `kind`: `problem_call`, `specialist_invitation`, `request_attack`, `request_clarification`, `critique`, `counterexample`, `evidence`, `rebuttal`, `clarification`, `comment`, or `dissent`;
- `request_mode: open | directed`, structured inert `requested_actor_refs`, and explicit requested next action for request kinds;
- prose body, cited source locators, and typed evidence/artifact references; and
- optional same-author `supersedes` correction reference.

An exchange is a message only. It may reference but never recreate a solution claim, candidate RFC revision, review, resolution, withdrawal, endorsement, decision, or tombstone. Parent and child share one thread root. `supersedes` is an acyclic same-author correction edge and never hides the prior entry. Generated request state is `open`, `acknowledged`, `answered`, `declined`, `withdrawn`, or `superseded`; acknowledgement and decline are voluntary response events and create no assignment, obligation, endorsement, standing, or authority. Generated exchange disposition is `open`, `resolved`, `withdrawn`, `superseded`, or `tombstoned`. Resolution and moderation are separate immutable artifacts; an exchange never rewrites itself to claim resolution.

Inviting a named person or agent to attack a problem is routing, not assignment or endorsement. Recipient references are inert data, never active mentions. An agent entry must not bind or be attributed to a principal unless independently verifiable delegation evidence binds principal identity, agent identity, repository authority, permitted entry kinds/targets, validity interval, and revocation state. Verification fails closed at ingestion. Otherwise the UI says “self-declared agent; no principal authority established.” No agent may claim human identity, reviewer independence, community standing, or decision authority through Git attribution alone.

### `ExchangeRequestEventV1`

The first version constrains a directed request to exactly one inert requested actor; an open request has none. Request lifecycle uses a separate canonical immutable event with globally scoped event ID, revision/digest, repository-authority ID, canonical path, commit SHA, exact request revision/digest, `event_kind: acknowledge | answer | decline | withdraw`, actor attribution/delegation evidence, idempotency key, and optional same-author supersession. `answer` requires an exact answer-exchange revision reference.

Acknowledgement, answer, and decline must come from the requested actor or a policy-verified delegate authorized for that request. Withdrawal must come from the inviter or an authorized moderator. Same-author correction is the only supersession path. Stale request targets, duplicate IDs with different bytes, multiple effective events of the same kind, conflicting terminal events, unauthorized actors, and answer events without a valid answer exchange fail closed. Identical replay is idempotent.

The generated request state is deterministic: open requests are `open` until a valid answer or inviter withdrawal; directed requests are `open`, `acknowledged`, `answered`, `declined`, `withdrawn`, or `superseded` according to the latest valid non-superseded event sequence. `answered`, `declined`, and `withdrawn` are terminal for that request revision. A new request requires a new exchange revision. Actor-oriented indexes derive “addressed to me” and “unanswered” only from verified actor/delegation matching.

### Exchange invariants

1. Every entry binds immutable target revisions; later edits create superseding entries.
2. Critiques, counterexamples, and dissent remain traversable after resolution.
3. A solution claim never auto-closes a problem.
4. An RFC recommendation never becomes a decision record.
5. Computed WMT conflicts never become attributed social disagreement without a human/agent exchange entry adopting that interpretation.
6. Funding, bounties, voting, treasury execution, assignment, and contributor standing are separate future authority artifacts.
7. The board supports neutral views for open calls, requests needing attack, unanswered specialist invitations, competing RFCs, contested solution claims, unresolved counterexamples, and dormant problems.

### Lifecycle and transition authority

All displayed state is regenerated from immutable content plus accepted events and decisions. Authors request transitions; they do not rewrite projected state. Decisions bind the exact affected revision and authority snapshot. Stale decisions do not retarget newer revisions.

| Entity | Exact source to target | Required canonical artifact | Authority, terminal/reopen, and stale rules |
| --- | --- | --- | --- |
| Problem disposition | absent to `draft` | problem revision | Author-created local draft; not published. |
| Problem disposition | `draft` to `open` | `publish_problem` decision | Repository maintainer; exact draft revision; safety validation passed. |
| Problem disposition | `open` to `closed` | `close_problem` decision | Maintainer; bounded reason; does not imply solved. |
| Problem disposition | `closed` to `open` | `reopen_problem` decision | Maintainer; exact closed revision and rationale. |
| Problem disposition | `draft` to `withdrawn` | request plus `withdraw_problem` decision | Author request or moderator authority; terminal except tombstone. |
| Problem disposition | `open` to `withdrawn` | request plus `withdraw_problem` decision | Author request or moderator authority; dissent retained; terminal except tombstone. |
| Problem disposition | `closed` to `withdrawn` | request plus `withdraw_problem` decision | Author request or moderator authority; dissent retained; terminal except tombstone. |
| Problem disposition | `draft` to `superseded` | `supersede_problem` decision | Maintainer; exact successor; terminal except tombstone. |
| Problem disposition | `open` to `superseded` | `supersede_problem` decision | Maintainer; exact successor; prior permalink retained; terminal except tombstone. |
| Problem disposition | `closed` to `superseded` | `supersede_problem` decision | Maintainer; exact successor; prior permalink retained; terminal except tombstone. |
| Problem assessment | `unassessed` to `solved_under_criteria` | `assess_problem_solved` decision | Named assessment authority; exact criteria/evidence/counterevidence/dissent. |
| Problem assessment | `solved_under_criteria` to `unassessed` | `reopen_problem_assessment` decision | Same authority scope; reason and invalidated evidence required. |
| Community RFC disposition | absent to `Draft` | RFC revision | Author-created local draft; not published. |
| Community RFC disposition | `Draft` to `In Review` | `open_rfc_review` decision | Community RFC maintainer; exact revision. |
| Community RFC disposition | `Draft` to `Withdrawn` | request plus `withdraw_rfc` decision | Author request or moderator authority; reopen only by explicit decision. |
| Community RFC disposition | `In Review` to `Accepted` | `accept_rfc` decision | Maintainer policy and required reviews; exact revision. |
| Community RFC disposition | `In Review` to `Rejected` | `reject_rfc` decision | Maintainer policy; reason/dissent retained; may reopen. |
| Community RFC disposition | `In Review` to `Withdrawn` | request plus `withdraw_rfc` decision | Author request or moderator authority; may reopen. |
| Community RFC disposition | `Rejected` to `In Review` | `reopen_rfc_review` decision | Maintainer; new rationale/review requirements. |
| Community RFC disposition | `Withdrawn` to `In Review` | `reopen_rfc_review` decision | Author request plus maintainer decision. |
| Community RFC disposition | `Accepted` to `Superseded` | `supersede_rfc` decision | Exact successor RFC revision; terminal except tombstone. |
| Solution disposition | absent to `submitted` | claim revision plus `publish_solution_claim` decision | Claimant drafts; maintainer publishes exact revision. |
| Solution disposition | `submitted` to `withdrawn` | request plus `withdraw_solution_claim` decision | Claimant request or moderator authority; terminal except tombstone. |
| Solution disposition | `submitted` to `superseded` | `supersede_solution_claim` decision | Exact successor claim revision; terminal except tombstone. |
| Solution assessment | `unreviewed` to `partially_supported` | `assess_solution_partial` decision | Named assessment authority; policy evidence and criterion IDs. |
| Solution assessment | `unreviewed` to `supported_under_criteria` | `assess_solution_supported` decision | Named assessment authority; policy evidence and criterion IDs. |
| Solution assessment | `unreviewed` to `rejected_under_criteria` | `assess_solution_rejected` decision | Named assessment authority; policy evidence and criterion IDs. |
| Solution assessment | `partially_supported` to `unreviewed` | `reopen_solution_assessment` decision | Same authority scope; reason and invalidated evidence required. |
| Solution assessment | `supported_under_criteria` to `unreviewed` | `reopen_solution_assessment` decision | Same authority scope; reason and invalidated evidence required. |
| Solution assessment | `rejected_under_criteria` to `unreviewed` | `reopen_solution_assessment` decision | Same authority scope; reason and invalidated evidence required. |
| Request state | `open` to `acknowledged` | `ExchangeRequestEventV1(acknowledge)` | Exact requested actor or verified delegate; nonterminal. |
| Request state | `open` to `answered` | `ExchangeRequestEventV1(answer)` | Exact requested actor/delegate plus answer-exchange ref; terminal. |
| Request state | `acknowledged` to `answered` | `ExchangeRequestEventV1(answer)` | Exact requested actor/delegate plus answer-exchange ref; terminal. |
| Request state | `open` to `declined` | `ExchangeRequestEventV1(decline)` | Exact requested actor/delegate; terminal. |
| Request state | `acknowledged` to `declined` | `ExchangeRequestEventV1(decline)` | Exact requested actor/delegate; terminal. |
| Request state | `open` to `withdrawn` | `ExchangeRequestEventV1(withdraw)` | Inviter or authorized moderator; terminal. |
| Request state | `acknowledged` to `withdrawn` | `ExchangeRequestEventV1(withdraw)` | Inviter or authorized moderator; terminal. |
| Request state | `open` to `superseded` | same-author corrected request revision | Exact successor; prior request retained; terminal. |
| Request state | `acknowledged` to `superseded` | same-author corrected request revision | Exact successor; prior request retained; terminal. |
| Exchange disposition | absent to `open` | exchange revision | Repository publish decision after validation. |
| Exchange disposition | `open` to `resolved` | resolution decision | Named resolver scope; may reopen. |
| Exchange disposition | `resolved` to `open` | reopen-resolution decision | Named resolver scope; reason required. |
| Exchange disposition | `open` to `withdrawn` | request plus withdrawal decision | Author request or moderator authority; terminal except tombstone. |
| Exchange disposition | `resolved` to `withdrawn` | request plus withdrawal decision | Author request or moderator authority; terminal except tombstone. |
| Exchange disposition | `open` to `superseded` | same-author correction plus publish decision | Exact successor; terminal except tombstone. |
| Exchange disposition | `resolved` to `superseded` | same-author correction plus publish decision | Exact successor; terminal except tombstone. |

Every decision/event includes expected source state, exact target revision/digest, repository-authority ID, authority snapshot, and idempotency key. CI applies accepted artifacts in canonical repository order. A source-state mismatch, stale target, decision for a newer/latest alias rather than an exact revision, conflicting transition, or attempted transition from a terminal state fails closed. Reopening always uses the explicit row above; absent rows are forbidden.

Tombstoning is a terminal moderation overlay rather than a disposition transition. An authorized moderation/redaction decision may overlay any published artifact revision, after which its unsafe payload is unavailable and only the safe audit tombstone remains. No lifecycle row may remove or reopen that overlay; reversal requires a new independently authorized restoration decision and a new clean artifact revision.

`under_investigation`, `candidate_solutions`, `contested`, unanswered, dormant, and unresolved-counterexample labels are deterministic attention projections, not dispositions or authority decisions. `closed`, `withdrawn`, `superseded`, support, rejection, resolution, and preserved dissent never arise from counts, WMT, or author-edited metadata.

### Web routes

- `/problems` — problem board with neutral status/attention views;
- `/problems/new` — create a local problem draft;
- `/problems/:problemId` — clearly labeled latest-revision alias;
- `/problems/:problemId/revisions/:revision` — immutable problem permalink;
- `/problems/:problemId/respond` — action chooser only;
- `/problems/:problemId/invite` — draft an open or directed request;
- `/problems/:problemId/claim-solution` — draft a canonical problem-solution claim and atomic reference exchange;
- `/problems/:problemId/challenge` — draft a critique or counterexample;
- `/problems/:problemId/compare?claims=…` — neutral exact-revision comparison of two or more solution claims;
- `/rfcs` — browse RFCs and lifecycle state;
- `/rfcs/new` — create a local RFC draft, optionally bundling problem-solution claims;
- `/rfcs/:rfcId` — clearly labeled latest-revision alias;
- `/rfcs/:rfcId/revisions/:revision` — immutable RFC permalink with formalization, links, reviews, dissent, and WMT analysis;
- `/rfcs/:rfcId/review` — draft an attributed peer review;
- `/rfcs/:rfcId/challenge` — draft a critique or counterexample;
- `/rfcs/:rfcId/revise` — draft a candidate RFC revision;
- `/solution-claims/:solutionClaimId/revisions/:revision`, `/exchanges/:exchangeId/revisions/:revision`, `/reviews/:reviewId`, and `/decisions/:decisionId` — immutable artifact permalinks.

Gate 2 routes only draft, validate, preview, and download a dependency-complete PR bundle. Every bundle contains canonical paths, exact immutable targets, schemas, generated-index deltas, attribution/disclosures, and a fixed safe filename; the UI previews the exact diff and says **Not published** before explicit download consent. Mutation endpoints and PR/API calls are absent or return explicit `405 Unavailable`. Routes collect no credentials, create no branch/PR, send no notification, and never imply successful submission. Live authenticated mutation requires a separate accepted issue design.

Comparison normalizes exact solution-claim revisions across coverage, approach role, criterion IDs addressed/not addressed, mechanism, assumptions, evidence, counterevidence, limitations, risks, falsifiers, assessment decisions, unresolved challenges, and preserved dissent. Ordering is neutral; the comparison emits no score, rank, winner, or inferred recommendation.

### Canonical repository structure

One repository belongs to one community or authority boundary and contains many problems and RFCs:

```text
community-rfcs/
├── README.md
├── rfc-repository.json
├── repository-layout.json
├── schemas/
│   ├── artifact-reference.schema.json
│   ├── external-source.schema.json
│   ├── problem.schema.json
│   ├── rfc-metadata.schema.json
│   ├── actor-attribution.schema.json
│   ├── problem-solution-claim.schema.json
│   ├── exchange-entry.schema.json
│   ├── exchange-request-event.schema.json
│   ├── rfc-claim-set.schema.json
│   ├── rfc-formalization-review.schema.json
│   ├── wmt-ingest.schema.json
│   ├── rfc-analysis-semantic.schema.json
│   ├── rfc-analysis-execution.schema.json
│   ├── rfc-peer-review.schema.json
│   ├── resolution.schema.json
│   ├── tombstone.schema.json
│   ├── artifact-index.schema.json
│   ├── repository-event.schema.json
│   └── decision.schema.json
├── policies/
│   ├── lifecycle-policy.json
│   ├── formalization-review-policy.json
│   ├── reviewer-attribution-policy.json
│   ├── logic-profiles/
│   └── budget-profiles/
├── actors/
│   └── ACTOR-0001.json
├── external-sources/
│   └── SOURCE-0001.json
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
├── events/
│   └── EVT-0001.json
├── tombstones/
│   └── TOMB-0001.json
├── indexes/
│   ├── problem-rfc-links.json
│   ├── exchange-targets.json
│   ├── actor-requests.json
│   └── lifecycle-state.json
├── fixtures/
│   ├── valid/
│   └── invalid/
└── .github/workflows/verify-rfcs.yml
```

Git is the revision system. Substantive changes use branches and pull requests; repositories do not duplicate every revision into extra folders. Problems and RFCs own their source documents and local sidecars. Multi-target artifacts—solution claims, exchanges, and decisions—have exactly one canonical top-level file. Generated indexes provide the bidirectional problem/RFC and exchange-target projections and must be reproducible from canonical artifacts. CI rejects duplicate IDs, conflicting files, stale indexes, missing targets, target-digest mismatches, forbidden reference cycles, and references to revisions that do not exist in Git history.

`repository-layout.json` is normative. It defines repository-authority ID; allowed artifact kinds; exact path regex and schema mapping; uppercase ID grammar; Unicode normalization; canonical filename and extension rules; authored versus generated paths; allowed extras; no-symlink policy; reference cardinality/depth; canonical JSON bytes; domain-separated digest algorithms; and generated-index commands. CI rejects unknown files in governed paths, case-folding collisions, path traversal, symlinks, invalid IDs, mutable self-digest input, stale projections, and non-reproducible indexes. Valid and invalid fixtures test every rule.

The displayed repository structure is the final normative v1 layout. JSON uses RFC 8785 JSON Canonicalization Scheme (JCS), UTF-8, and NFC-normalized strings. JSON numbers are restricted to interoperable safe integers; decimal, arbitrary-precision, and real values are canonical strings under their field schemas. Self-digest fields and generated projections are excluded before canonicalization. Markdown/text source uses UTF-8 without BOM, NFC, LF line endings, and exactly one final newline.

The v1 hash profile is `castalia.sha256-jcs.v1`. Artifact digest preimage is the ASCII/UTF-8 bytes `castalia-artifact-v1`, NUL, artifact kind, NUL, schema version, NUL, then canonical artifact bytes. The digest string is `sha256:` plus 64 lowercase hexadecimal SHA-256 characters. The required test vector uses kind `test-vector`, schema `castalia.test.v1`, and JCS body `{"schema_version":"castalia.test.v1","value":"α"}`; its expected digest is `sha256:a080d96ed43647029898f9a0c450a17c3649ce8ea389ae6872f0275b741f58eb`. CI fixtures must also cover key reordering, Unicode normalization, line endings, excluded self-digests, number rejection, domain separation, and one-byte mutation.

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

Reviews carry immutable `responds_to` and same-author correction references. Review status, resolution, rationale, and preserved-dissent projections come from separate events/decisions rather than mutable review fields. Computed compatible subsets remain separate from attributed human positions. Accepted RFCs retain unresolved and preserved dissent with neutral ordering; no computed subset or human position is ranked or called defeated without an authorized governance artifact.

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

A clear/reset action terminates the worker tree, drops references, revokes object URLs, and removes generated exports. Navigation, reload, cancellation, crash, clear, and export paths must be tested with storage and network inspection. A later private-content or persistence issue design must define authorization evidence, redaction, encryption, retention, cache, export, clipboard, incident, and deletion behavior. WMT's existing local trajectory tree is a product reference, not reusable persistence authority.

### Formalization seam

The first slice does not call OpenRouter or any other model provider. It accepts checked-in typed IR or manual pasted IR and requires the English back-translation to be reviewed.

Any later assisted formalization must be a separate accepted issue design or explicitly reviewed amendment that defines:

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
2. **Candidate RFCs** — each linked through an explicit full/partial coverage claim and an independent direct-solution/prerequisite/mitigation/experiment/counterproposal role.
3. **Exchange** — addressable calls, invitations, responses, critiques, evidence, counterexamples, rebuttals, comments, dissent, and discussion links to separate canonical revision or endorsement/review artifacts.

Local drafting begins with an explicit action chooser: problem, RFC, problem-solution claim, invitation/request, challenge/counterexample, formalization review, peer review, or candidate revision. The form explains the authority and validation contract for that artifact and requires exact target revisions. Choosing RFC may atomically bundle optional problem-solution claims but never preselects `full` coverage. Choosing an invitation requires open/directed mode, inert addressee references, and a requested action, with “invitation—not assignment or endorsement” persistent copy. The final preview says **Not published** and shows every file/diff in the dependency-complete PR bundle.

Human-authored, agent-authored, and agent-assisted entries have distinct text labels in every card, detail, export, and accessible name; color or avatar alone is insufficient. Thread order defaults to repository chronology with explicit response edges. Neutral filters do not hide unresolved critiques or dissent and do not convert activity counts into quality scores. Solution-claim cards say **RFC claims to address this problem** until an exact decision-backed assessment is displayed; they never collapse “claim,” “supported,” and “problem solved.”

The comparison surface displays at least two exact solution-claim revisions side by side and provides direct access to each claim's challenges, counterexamples, decisions, and preserved dissent. Latest aliases visibly name and link the immutable revision they currently resolve to; superseded and closed artifacts retain permanent text-accessible routes.

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
- External citations cannot become canonical solution claims, decisions, standing, or delegation. Cross-repository import requires a separately authorized import decision, immutable source evidence, local revalidation, and a new local canonical artifact; private or credentialed fetching remains prohibited.
- Actor identity, `acting_for`, and community standing are separate claims. An agent may name a principal only with an explicit authorization-evidence reference accepted by repository policy; otherwise display “self-declared agent; principal authority not verified.”
- Directed invitations are opt-in routing requests. They do not create assignments, obligations, endorsements, direct notifications, or public claims about the target. Live notification requires verified target identity, recipient preferences, rate limits, anti-replay controls, abuse reporting, and repository moderation policy.
- Reject secrets, credentials, private-room material, doxxing, and unsupported sensitive-data classes before export. Git permanence must be shown before submission. A moderation/redaction decision creates a content-addressed tombstone that preserves graph integrity and decision provenance without redisplaying removed content; history rewriting is a separately authorized incident procedure.
- Gate 2 uses inert actor references in rendered copy and exports; it never emits active `@mentions`. The example specialist is represented by synthetic `ACTOR-SPECIALIST-EXAMPLE`. Silence has no effect. Only the inviter may request withdrawal, and nobody may supersede another author's prose.
- A repository-owned content policy classifies harassment and illegal/unlawful content as prohibited alongside credentials, secrets, doxxing, private material, and unsupported personal/sensitive data. Gate 2 accepts only `classification: public`; it rejects clearly prohibited content before render/export and fails closed into a non-exportable quarantine state when adjudication is required. It also rejects unsupported sensitivity classes, remote images/embeds, and unallowlisted links. Quarantined content cannot enter a downloadable PR bundle. Unreviewed permitted content is labeled and excluded from recommendations.
- Per-artifact ceilings are 64 KiB canonical bytes, 16 KiB body text, 32 references, exactly one inert recipient for a directed request, zero recipients for an open request, 16 external citations, and graph depth 64. A local PR bundle is capped at 128 artifacts, 32 new exchange entries, 8 invitations, and 1 MiB canonical bytes. Identical artifacts deduplicate by repository-authority ID plus globally scoped ID and digest. These are safety ceilings, not standing or quality signals.
- Repository policy defines duplicate detection, per-principal quotas, quarantine, hostile-link handling, dual-use review, moderator reason codes/scope, reporting, appeals, audit evidence, observability, and incident response. Multiple agents with one verified principal deduplicate to that principal for abuse controls. No view ranks, trends, recommends, or aggregates endorsements/invitations from unverified identities.
- Correction, author withdrawal, moderator hiding, redaction, and emergency purge are distinct. Redaction replaces rendered payload with a safe content-addressed tombstone; projections, search, bundles, caches, and later exports honor it. The audit event retains only safe provenance, digest, reason code, authority evidence, appeal state, and retention metadata. Emergency history rewrite and invalidation of known derivatives require separately scoped incident authority; already-forked copies cannot be recalled.
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
- Add canonical JSON Schemas and generated TypeScript for artifact/local/external references, external exchange sources, actors/delegations, problems, RFC metadata, problem-solution claims, exchanges, events, tombstones, generated indexes, and problem/RFC lifecycle decisions.
- Add `repository-layout.json` plus deterministic index generation and strict path/reference validation.
- Add positive and hostile fixtures for projection, digest binding, status handling, duplicate IDs, conflicting declarations, undeclared vocabulary, SMT tokens, unknown/invalid/limit states, and source locators.
- Add graph fixtures for many-to-many solution claims, immutable target revisions, actor/principal separation, exchange replies/supersession, stale indexes, broken links, duplicate IDs, replay, forbidden cycles, tombstones, and problem/RFC lifecycle decisions.
- Add hostile content fixtures proving harassment, illegal/unlawful content, secrets, doxxing, unsupported personal/sensitive data, malicious links, and ambiguous cases are rejected or non-exportably quarantined with reason codes, moderator scope, appeal, and audit evidence.
- Keep all routes fixture-only and network-free.

### Gate 2 — minimum useful review slice

- Browse and inspect repository-backed public problem and RFC fixtures.
- Draft, validate, preview, and download a dependency-complete problem, RFC, solution claim, exchange, review, or candidate-revision PR bundle for later human submission; display **Not published** throughout.
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

- end-to-end repository fixtures where a proof-system hardness problem is drafted and opened; an inert synthetic specialist receives a non-notifying directed request; the addressee voluntarily acknowledges, answers, or declines; human-authored and agent-authored responses remain distinguishable; an RFC submits a bounded solution claim; a counterexample contests it; at least two exact solution-claim revisions are neutrally compared; a candidate revision responds; preserved dissent remains reachable; and only final decision artifacts change problem/RFC/solution assessment state;
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

1. Confirm the dedicated credentialless analysis origin and production COOP/COEP deployment target through Gate 0.
2. Calibrate the fixed security ceilings against supported devices without raising them in the current profile.
3. Define the community RFC maintainer policy and repository evidence required for feature RFC decisions.

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
- `https://x.com/DreggNet/status/2081060089079746851` as the user-specified canonical example for RFC exchange behavior; exact post text was not retrievable because the official API returned `CreditsDepleted` and the public fallback was denied. It remains an unclassified source-only record and supports no inferred body, intent, actor, or exchange kind
- `https://x.com/DreggNet/status/2080506484304072910` as the canonical problem-board routing example. Public-mirror transcription after the official API returned `CreditsDepleted`: “hi `@math__street` it would be really meaningful if you could attack the hardness of approximate query / search based proof systems.” This is `mirror_transcribed`, not independently verified against the canonical post; the original X URL remains canonical
- Neither X source establishes account identity, delegation, recipient consent, community standing, product semantics, or implementation authority. Conformance fixtures replace the live handle with inert synthetic `ACTOR-SPECIALIST-EXAMPLE`

## Peer-review record

See the [Issue #16 feature-design peer-review record](issue-16-rfc-feature-review.md). All focused independent reviews requested changes. The issue and PR remain open and in review until the recorded blockers and remaining decisions are closed and freshly reviewed.
