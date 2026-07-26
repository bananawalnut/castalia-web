# Issue #16 RFC-feature peer-review record

- Feature design: [RFC and Problem Board exchanges with World Model Trajectories peer review](issue-16-rfc-feature-design.md)
- Ontology correction: this development artifact was originally mislabeled “RFC 0001”; Issue #16 and PR #17 are the canonical development controls, while RFC identifiers are reserved for community feature artifacts.
- Reviewed draft commit: `9e68ac802943212ec64c625fd216a8e2044d9426`
- Review date: 2026-07-25
- Overall initial disposition: **REQUEST CHANGES**
- Current RFC posture: Draft; patched in response, awaiting fresh exact-head review

## Review protocol

Three independent reviewers inspected the same draft and pinned sources before seeing the other verdicts:

1. WMT technical correctness and integration feasibility;
2. security and privacy; and
3. product, epistemic governance, and peer-review process.

A finding is closed only when the RFC is patched, explicitly blocked behind a named prerequisite, rejected with source-backed rationale, or preserved as dissent. Review approval would not accept the RFC or authorize implementation.

## Technical review

Verdict: **REQUEST CHANGES**

The reviewer verified the exact WMT commit and returned eight findings:

| ID | Severity | Finding | Resolution in current draft |
| --- | --- | --- | --- |
| T1 | Critical | `RfcClaimSetV1` did not map to WMT's `sorts`/`preds`/`funcs`/`claims` ingest shape; unknown metadata could be discarded and auto-declared. | Added separate `WmtIngestV1`, deterministic projection, explicit field mapping, duplicate/collision/type/grammar rejection, no auto-declaration, and projected-byte digest. |
| T2 | Critical | WMT did not propagate malformed or `unknown` solver output fail-closed through all analysis, lattice, repair, witness, and defeasible phases. | Gate 0 now rejects the pinned engine unchanged and requires exact typed response parsing, phase-complete terminal uncertainty, and hostile phase-by-phase tests. |
| T3 | High | “Optimal repair” searched one MUS and could return an unverified fallback that did not repair multiple conflicts. | Removed repair output from the first slice. Any later repair contract must state scope, solver-verified restoration, proven/not-proven optimality, and conflict completeness. |
| T4 | High | Defeasible output and forced-consequence/witness calculations used different effective theories. | First slice is strict and unweighted. Defeasible reasoning, weights, and ranked repair are deferred behind a separate reviewed policy/API. |
| T5 | Critical | Existing drivers could not enforce the RFC's budgets; repair could allocate an exponential powerset before wrapper cancellation. | Added versioned numeric security ceilings, distinct stop states, pre-allocation checks, worker-tree termination, no partial semantic result, and Gate 0 resource-model fixes. |
| T6 | High | Dedicated-worker feasibility was asserted but unproved for pthread Z3, Vite, nested workers, COOP/COEP, teardown, and browser support. | Replaced confirmation with a runnable Gate 0 production spike covering module/nested workers, asset paths, headers, cancellation, recovery, and browser support. |
| T7 | High | Packaging/reproducibility omitted pinned toolchains, rebuild evidence, Z3 identity, lockfiles, and deterministic versus timestamped result separation. | Added signed provenance, reproducible-build comparison, SBOM/toolchain/artifact binding, exact Z3 checks, and separate deterministic semantic versus execution envelopes. |
| T8 | High | Verification missed projection, phase-level uncertainty, multi-conflict repair, OOM, incomplete drivers, retry, and exact-Z3 failures. | Replaced the generic plan with named hostile projection, solver-response, resource, cancellation/retry, determinism, and pinned-Z3 tests. |

Technical acceptance blockers remain in Gate 0 until implementation evidence exists. The RFC no longer claims the current fork satisfies them.

## Security and privacy review

Verdict: **REQUEST CHANGES**

The reviewer returned eight high-severity and two medium-severity findings:

| ID | Severity | Finding | Resolution in current draft |
| --- | --- | --- | --- |
| S1 | High | Untrusted identifiers, real literals, operators, and relations could inject SMT-LIB. | Added closed logic/lexical profile, compiler-owned symbol encoding, no raw real/arithmetic input, no auto-declaration, and hostile SMT-token fixtures; Gate 0 must fix the compiler. |
| S2 | High | Malformed or `unknown` solver output could become false conflicts, subsets, overrides, or coherence. | Added exact bounded response grammar and terminal `unknown`/`invalid` behavior at every phase; Gate 0 blocks unchanged engine use. |
| S3 | High | Resource limits were late and non-normative. | Added numeric ceilings for bytes, claims, declarations, nodes, depth, arity, strings, calls, per-query/wall time, outputs, subsets, and concurrency. Profiles may only lower them. |
| S4 | High | A worker is an availability boundary, not security containment. | Moved analysis to a dedicated credentialless origin in a sandboxed frame with narrow messaging, CSP `connect-src 'none'`, Trusted Types, no credentials, and bounded inner workers. |
| S5 | High | Private RFC and Matrix-content authorization was undefined. | First slice is public-repository RFC only and rejects Matrix-origin text, private fetches, and cross-route transfer. Private analysis requires a later privacy RFC. |
| S6 | High | Self-consistent manifests/digests did not establish trustworthy supply-chain provenance. | Added locked builds, signed provenance, SBOM, reproducible-build comparison, protected update/rollback evidence, and independent CI regeneration. |
| S7 | High | XSS controls covered too few Markdown, SVG, URL, attribute, import, and export surfaces. | Required text-node rendering, no raw HTML, URL allowlists, sanitized SVG, no untrusted HTML sinks, CSP/Trusted Types, and all-field hostile fixtures. |
| S8 | High | A browser self-digest did not make an analysis authoritative. | Downgraded browser output to unverified derived evidence and requires canonicalized, domain-separated, locked-CI regeneration before “verified computational evidence.” |
| S9 | Medium | “Memory-only” omitted heap, BFCache, object URL, crash, cache, clear, and export semantics. | Added clear/reset worker teardown, reference/object-URL cleanup, no telemetry/cache, export preview, and navigation/reload/crash/storage tests. |
| S10 | Medium | Model/credential exclusion relied on convention. | Gate 0 package contains no model/persistence client; the analysis origin receives no credentials and enforces import-graph, dependency, endpoint, CSP, and runtime no-network checks. |

Security findings S1–S8 remain acceptance blockers until Gate 0 and the remaining canonicalization/deployment decisions have source and runtime evidence.

## Product and epistemic-governance review

Verdict: **REQUEST CHANGES**

The reviewer returned seven high-severity and one medium-severity finding:

| ID | Severity | Finding | Resolution in current draft |
| --- | --- | --- | --- |
| P1 | High | “Disagreement,” “position,” “forced consequence,” and WMT “authority” language could masquerade as truth, consensus, or social fact. | Replaced with formalization conflict, maximal compatible claim subset, and consequence entailed under a named profile; WMT is evidence, never authority. Every view/export carries the non-truth/non-consensus boundary. |
| P2 | High | `formalization_status` could be self-authored and omitted reviewer independence, coverage, contest, and transition rules. | Made status derived from `RfcFormalizationReviewV1`; added two-reviewer repository policy, source coverage, missing-claim and IR inspection, contest handling, and readiness states. |
| P3 | High | Weights/defaults created an ungoverned policy layer and made claims look objectively expendable. | First slice is strict and unweighted with no ranked repair. Weight/default/specificity policy is deferred. |
| P4 | High | Computed subsets and actual minority positions were conflated; dissent lifecycle was absent. | Separated computed and attributed positions; added response/supersession/resolution/dissent fields, neutral ordering, and permanent links to unresolved/preserved dissent. |
| P5 | High | Git attribution was too weak for `approve`/`reject` dispositions. | Renamed individual dispositions to recommendations; required immutable repository identity/evidence, author/committer and signature state, model/COI disclosures, and explicit “community standing not established” copy. |
| P6 | High | RFC state transitions, decision authority, amendments, supersession, and stale reviews were underspecified. | Added lifecycle state machine, immutable repository decision records, substantive-revision reset rules, stale-analysis treatment, and repository-versus-community authority separation. |
| P7 | Medium | Accessibility was a test bullet rather than a product contract. | Made WCAG 2.2 AA normative with text/table alternatives, keyboard/focus, non-color status, live regions, zoom/reflow, reduced motion, contrast, and screen-reader evidence. |
| P8 | High | The first slice was split between analysis and later review export, so usefulness was not evaluable. | Defined one minimum useful slice: public RFC, reviewed claim set, strict/unweighted local analysis, accessible views, attributed recommendation export, no mutation/model/private data, realistic fixtures, and moderated usefulness/misconception evaluation. |

## Resolution ledger posture

All initial findings caused normative RFC changes. None were dismissed. Findings that require code or deployment proof are resolved at the document-design level but remain explicit acceptance blockers behind Gate 0 or the listed acceptance decisions.

## Post-review product correction — paired problem board and RFC exchange

After the initial review, the user added a substantive product requirement:

- the RFC system must support addressable exchanges between people and agents;
- it must be paired with a problem board that supports directed invitations to attack a problem;
- an RFC may claim to solve all or part of a problem; and
- submitting a solution claim must not itself mark the problem solved.

The RFC now adds `ProblemEntryV1`, `RfcMetadataV1`, `ProblemSolutionClaimV1`, and `ExchangeEntryV1`; a many-to-many problem/RFC graph; append-only exchanges; human/agent attribution; problem and solution-claim lifecycle states; board and RFC routes; and a canonical repository structure. This is a substantive revision. Initial reviews do not approve it.

Focused review batch `deleg_2d387995` completed with three `REQUEST CHANGES` verdicts. Resolution began, then paused at the user's checkpoint request. The complete reports are preserved verbatim:

- [Focused ontology review](reviews/issue-16-problem-exchange-ontology-review.md)
- [Focused security and authority review](reviews/issue-16-problem-exchange-security-review.md)
- [Focused product and workflow review](reviews/issue-16-problem-exchange-product-review.md)

At checkpoint `1153420`, canonical root ownership and part of the immutable revision, solution-claim, threading, request, lifecycle, and delegation model had been corrected. Work resumed after the ontology correction that development stays issue-framed and RFC identifiers are reserved for community feature artifacts. The design now addresses every focused finding below, but those resolutions remain provisional until fresh exact-head reviewers approve them. Do not infer the inaccessible X post's contents.

### Focused ontology resolution ledger

| Finding | Resolution in feature design | Status |
| --- | --- | --- |
| O1 canonical ownership | Multi-target solution claims, exchanges, events, decisions, and tombstones each have one canonical top-level file; indexes are generated. | Design-resolved; re-review required |
| O2 mutable projections in immutable revisions | Problem/RFC revisions contain authored content and forward semantics only; lifecycle, backlinks, attention, review, and decision state are generated. | Design-resolved; re-review required |
| O3 solution-claim revision safety | Added immutable claim revision/digest, problem digest, canonical path/commit, same-ID supersession, and decision-derived status. | Design-resolved; re-review required |
| O4 mixed solution semantics | Split `coverage` from `approach_role`; bound coverage to exact criterion IDs. | Design-resolved; re-review required |
| O5 exchange/entity duplication | Exchange is message-only and references canonical claims/revisions/reviews/events/decisions rather than recreating them. | Design-resolved; re-review required |
| O6 underconstrained threading | Added thread ID, root subject, zero-or-one parent, same-root rule, and acyclic same-author correction edges. | Design-resolved; re-review required |
| O7 lifecycle/attention conflation | Added decision-backed disposition/assessment dimensions, derived attention facets, and a complete transition-authority matrix. | Design-resolved; re-review required |
| O8 attribution/delegation ambiguity | Separated authors, submitter, committer, signer, automation, principal, delegation evidence, and standing snapshot; delegation fails closed. | Design-resolved; re-review required |
| O9 inaccessible external exchange | Added `ExternalExchangeSourceV1`; unavailable content remains source-only and semantically unclassified. | Design-resolved; re-review required |
| O10 relation/route/layout determinism | Added canonical relation directions, immutable routes, normative layout manifest, path/ID/hash/no-symlink rules, strict CI, and fixtures. | Design-resolved; re-review required |

### Focused security and authority resolution ledger

| Finding | Resolution in feature design | Status |
| --- | --- | --- |
| S1 acting-for impersonation | Principal attribution requires independently verifiable scoped, time-bound, revocable delegation evidence; otherwise explicitly self-declared only. | Design-resolved; re-review required |
| S2 invitation harassment | Recipients are inert structured references; Gate 2 never notifies or emits active mentions; consent, opt-out, blocking, quotas, and audit gate any future notification. | Design-resolved; re-review required |
| S3 spam/Sybil and attention capture | Added artifact/bundle ceilings, deduplication, principal-level abuse accounting, quarantine/moderation policy, and no rank/trend/recommend aggregation. | Design-resolved; re-review required |
| S4 lifecycle authority | All consequential state is generated from typed decisions/events; close does not imply solved and authors cannot launder status. | Design-resolved; re-review required |
| S5 replay/stale/graph confusion | Added repository authority, globally scoped IDs, digests, idempotency, exact targets, acyclic rules, stale-target rejection, and deterministic projections. | Design-resolved; re-review required |
| S6 cross-repository authority | Split local canonical refs from external citations; no auto-fetch or lifecycle effect; imports require separate authority. | Design-resolved; re-review required |
| S7 content safety/moderation | Gate 2 is public-only, bounded, no remote embeds, hostile-render tested, visibly unreviewed, and governed by quarantine/moderation/appeal/audit policy. | Design-resolved; re-review required |
| S8 redaction/takedown | Distinguished correction, withdrawal, hiding, redaction, tombstone, emergency purge, derivative invalidation, and fork-recall limits. | Design-resolved; re-review required |
| S9 route overclaim | Gate 2 only drafts/validates/previews/downloads a `Not published` bundle; no mutation endpoint, credential, PR, branch, or notification. | Design-resolved; re-review required |
| S10 X-source authority | Recorded unavailable versus mirror-transcribed provenance, no identity/consent/authority inference, and synthetic inert fixture actor. | Design-resolved; re-review required |

### Focused product and workflow resolution ledger

| Finding | Resolution in feature design | Status |
| --- | --- | --- |
| P1 directed requests | Added open/directed mode, inert addressees, voluntary acknowledge/answer/decline lifecycle, and end-to-end fixtures. | Design-resolved; re-review required |
| P2 competing solution representations | `ProblemSolutionClaimV1` is sole canonical assertion; exchange only references it; assessment is decision-derived; UI says “RFC claims to address.” | Design-resolved; re-review required |
| P3 comparison workflow | Added problem-scoped exact-revision comparison across criteria, evidence, risks, challenges, decisions, and dissent without ranking. | Design-resolved; re-review required |
| P4 immutable navigation | Added immutable problem/RFC/solution/exchange/review/decision routes; latest aliases and old dissent remain resolvable. | Design-resolved; re-review required |
| P5 publication overclaim and overloaded routes | Reframed Gate 2 as local draft/validate/preview/download, added intent-specific routes/action chooser, and dependency-complete PR bundles. | Design-resolved; re-review required |

## Exact-head review of `cef7e5d`

Fresh review batch `deleg_603a0786` returned three `REQUEST CHANGES` verdicts. Verbatim reports:

- [Ontology review](reviews/issue-16-exact-head-ontology-review-cef7e5d.md)
- [Security review](reviews/issue-16-exact-head-security-review-cef7e5d.md)
- [Product review](reviews/issue-16-exact-head-product-review-cef7e5d.md)

| Blocking finding | Correction after `cef7e5d` | Status |
| --- | --- | --- |
| O5 exchange/revision/endorsement contradiction | Exchange capability and UX now permit discussion/reference only; revision and endorsement/review remain separate canonical artifacts. | Patched; follow-up review required |
| O7 incomplete transition matrix | Replaced compressed rows with exact directed transitions, authority artifacts, terminal/reopen rules, exact revision/source-state binding, stale/conflict rejection, and a separate tombstone overlay. | Patched; follow-up review required |
| O10 unresolved layout/canonicalization | Made the displayed v1 layout final; selected RFC 8785 JCS plus NFC/safe-number/text rules and domain-separated SHA-256; added a concrete digest test vector and removed those open decisions. | Patched; follow-up review required |
| S7 harassment and unlawful content | Content policy now prohibits harassment and illegal/unlawful content; Gate 2 rejects or non-exportably quarantines it; hostile fixtures require reason/authority/appeal/audit evidence. | Patched; follow-up review required |
| P1 request lifecycle event contract | Added immutable `ExchangeRequestEventV1`, one-recipient directed requests, actor/delegation authority, answer references, idempotency/supersession/conflict rules, deterministic state, and actor indexes/fixtures. | Patched; follow-up review required |

## Follow-up review of `77fd75f`

Review batch `deleg_25180eab` returned one `APPROVE` and two `REQUEST CHANGES` verdicts. Preserved reports:

- [Ontology review](reviews/issue-16-follow-up-ontology-review-77fd75f.md) — `REQUEST CHANGES`
- [Security review](reviews/issue-16-follow-up-security-review-77fd75f.md) — `APPROVE`
- [Product review](reviews/issue-16-follow-up-product-review-77fd75f.md) — `REQUEST CHANGES`

| Finding | Correction after `77fd75f` | Status |
| --- | --- | --- |
| O7 tombstone/disposition contradiction | Removed `tombstoned` from exchange disposition, retained it solely as a moderation overlay, and removed “terminal except tombstone” wording. | Patched; final review required |
| O7 concurrent event ordering | Defined protected first-parent acceptance order, canonical-path/digest tie-breaking, and fail-closed same-source/incompatible concurrency. | Patched; final review required |
| P1 open-request answer authority | Open answers now require a repository-authorized actor or verified delegate; acknowledgement/decline are invalid for open requests. | Patched; final review required |
| P1 incomplete fixtures | Added immutable event artifacts for acknowledge/answer/decline/withdraw/supersede, hostile stale/authority/conflict/replay fixtures, and post-acceptance problem/thread/actor projections. | Patched; final review required |
| S1–S10 | Follow-up security review found no High security/authority blocker. | Approved at `77fd75f` |

## Final review of `069a1ca`

Review batch `deleg_4c36a8d1` returned two `APPROVE` verdicts and one narrow `REQUEST CHANGES` verdict. Preserved reports:

- [Ontology review](reviews/issue-16-final-ontology-review-069a1ca.md) — `APPROVE`
- [Security review](reviews/issue-16-final-security-review-069a1ca.md) — `APPROVE`
- [Product review](reviews/issue-16-final-product-review-069a1ca.md) — `REQUEST CHANGES`

The final product blocker was a matrix/prose mismatch only: the general `open → answered` row required a requested actor even though open requests have none. The matrix now has separate directed-request and open-request rows, with repository-policy actor/delegate authority for the open case. Positive authorized-open-answer and hostile unauthorized-open-answer fixtures are explicit. A final exact-head product confirmation is required.

Remaining blockers:

1. complete the Gate 0 compiler/parser/resource fixes and reproducible package;
2. prove the credentialless-origin and nested-worker topology on the intended deployment target;
3. calibrate the fixed security ceilings without raising the current profile;
4. define the community RFC maintainer policy and decision evidence; and
5. obtain final exact-head product/workflow confirmation of the post-`069a1ca` matrix correction.

## Final review disposition

**REQUEST CHANGES remains in force.** The Issue #16 feature design incorporates the findings but is not approved. Approval requires the remaining blockers, follow-up review, and explicit repository-maintainer approval on Issue #16/PR #17. Approval would authorize implementation issue decomposition only—not implementation, merge, deployment, credentials, Matrix access, funding, or governance action.
