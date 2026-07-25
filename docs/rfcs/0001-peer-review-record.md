# RFC 0001 peer-review record

- RFC: [World Model Trajectories for RFC peer review](0001-world-model-trajectories-peer-review.md)
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

Remaining blockers:

1. choose and test-vector canonical JSON and domain-separated hashing;
2. complete the Gate 0 compiler/parser/resource fixes and reproducible package;
3. prove the credentialless-origin and nested-worker topology on the intended deployment target;
4. calibrate the fixed security ceilings without raising the current profile;
5. name the repository RFC maintainer role and decision evidence;
6. choose the canonical repository artifact layout; and
7. obtain fresh exact-head technical, security/privacy, and product/governance verdicts on the patched RFC.

## Final review disposition

**REQUEST CHANGES remains in force.** The current draft incorporates the initial findings but is not accepted. Acceptance requires the remaining blockers, fresh review, and an immutable repository decision record. Acceptance would authorize issue decomposition only—not implementation, merge, deployment, credentials, Matrix access, funding, or governance action.
