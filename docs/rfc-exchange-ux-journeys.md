# RFC exchange UX journeys and information architecture

Status: implementation contract for Issue #19. This document specifies future production routes; the only route implemented by Issue #19 is the fixture-only preview at `/docs/rfc-exchange/preview`.

## Product-wide authority frame

Every surface identifies the exact immutable revision it renders. A latest alias says **Latest-route alias** and links the immutable revision currently selected. Local drafting says **Not published** from entry through download. Publication, lifecycle decisions, notifications, assignment, endorsement, ranking, and problem resolution are not inferred from activity or user input.

A solution relation is always introduced as **RFC claims to address this problem**. It is not proof that the RFC works or that the problem is solved. Comparison is neutral and produces no score, rank, winner, or recommendation. A directed request routes to one inert actor reference; it does not notify, assign, obligate, or imply endorsement.

## Information architecture

Primary product areas:

1. **Problem Board** — browse exact problem revisions and derived attention facets.
2. **RFCs** — browse exact RFC revisions, claims, reviews, and evidence.
3. **Exchange** — traverse requests, responses, critiques, counterexamples, revisions, and preserved dissent by repository chronology and explicit reply edges.
4. **Compare** — inspect two or more exact solution-claim revisions without ranking.
5. **Local draft** — choose an artifact, validate locally, preview exact bundle files, then download only after explicit consent.

Persistent actor-oriented views under Problem Board filters:

- **Requested to me** means a verified actor/delegate match against exactly one recipient on a directed request. It never means assigned to me.
- **Unanswered** includes open requests without an accepted answer event and directed requests in `open` or `acknowledged` state. Silence has no effect.
- **Open requests** contain no recipient. Any answer still requires repository-policy-authorized attribution.

## Route journeys

Each row pins the primary action, absent/invalid behavior, and authority copy. Draft actions remain local until bundle download.

| Route | Journey and primary action | Empty / error state | Exact authority copy |
| --- | --- | --- | --- |
| `/problems` | Scan neutral attention filters; open an exact problem revision. | **No matching problems.** Clear filters; do not infer inactivity or quality. Invalid index: **Problem Board unavailable — generated index validation failed.** | **Attention labels are derived routing aids, not decisions.** |
| `/problems/new` | Create a local problem draft; validate; preview bundle. | Blank draft is instructional. Invalid fields go to the error summary and remain local. | **Not published. No repository change or notification has occurred.** |
| `/problems/:problemId` | Follow a visibly labeled latest alias to its current immutable revision. | **Problem not found. No repository lookup was attempted beyond the checked source.** | **Latest-route alias — currently resolves to revision {revision}.** |
| `/problems/:problemId/revisions/:revision` | Inspect definition, criteria, candidate RFC claims, and exchange; choose Respond. | Missing/digest-invalid revision fails closed and renders no dependent claims. | **Immutable problem revision. Closed does not mean solved.** |
| `/problems/:problemId/respond` | Choose invitation/request, solution claim, critique/counterexample, or comment. | Unsupported action stays unavailable and explains the required future authority. | **Choose a local artifact. No action submits or publishes it.** |
| `/problems/:problemId/invite` | Choose open or single-recipient directed mode; enter inert actor ref and requested action; preview. | Open requires zero recipients; directed requires exactly one. Validation never converts one mode into the other. | **Invitation — not assignment, endorsement, obligation, or notification.** |
| `/problems/:problemId/claim-solution` | Bind an RFC revision and declare coverage, approach role, addressed/not-addressed criteria, limits, and falsifiers. | Missing exact target or coverage blocks export. `full` is never preselected. | **RFC claims to address this problem. This claim does not mark the problem solved.** |
| `/problems/:problemId/challenge` | Draft a critique or counterexample against an exact revision; preview its reply edge. | Missing locator/target blocks export; quarantined content is not rendered into the bundle. | **A challenge is attributed review material, not a lifecycle decision.** |
| `/problems/:problemId/compare?claims=…` | Compare at least two exact solution-claim revisions; open each challenge, decision, and dissent trail. | Fewer than two valid claims: **Select at least two exact claim revisions.** Invalid claim is omitted with an error, never silently replaced by latest. | **Neutral comparison — no score, rank, winner, or recommendation.** |
| `/rfcs` | Browse lifecycle labels and attention facets; open an exact RFC revision. | **No matching RFCs.** Invalid index: **RFC collection unavailable — generated index validation failed.** | **Lifecycle state comes only from accepted decision artifacts.** |
| `/rfcs/new` | Draft an RFC and optionally bundle explicit solution claims; validate and preview files. | Empty form remains local. Optional claim omission is shown as **No problem-solution claim included.** | **Not published. A draft RFC has no community disposition.** |
| `/rfcs/:rfcId` | Follow a visibly labeled latest alias to current immutable revision. | Missing alias target fails closed; never guesses newest lexical ID. | **Latest-route alias — currently resolves to revision {revision}.** |
| `/rfcs/:rfcId/revisions/:revision` | Inspect source, solution claims, exchange, formalization, WMT evidence, reviews, revisions, and dissent. | WMT failure does not hide source/review. Invalid revision hides dependent projections. | **Immutable RFC revision. Analysis is evidence, not authority.** |
| `/rfcs/:rfcId/review` | Draft attributed peer review against exact RFC/claim-set revisions. | Missing attribution, conflicts disclosure, or targets blocks export. | **A review recommendation does not approve or reject the RFC.** |
| `/rfcs/:rfcId/challenge` | Draft critique/counterexample against RFC, claim, evidence, or formalization. | Invalid target/locator blocks export and focuses summary. | **This entry preserves disagreement; it does not decide disposition.** |
| `/rfcs/:rfcId/revise` | Fork a candidate revision, show parent binding and exact changed files. | Parent mismatch blocks preview. Original remains visible and immutable. | **Candidate revision — does not replace the accepted source until separately submitted and accepted.** |
| `/solution-claims/:solutionClaimId/revisions/:revision` | Inspect exact coverage, role, criteria, evidence, assessment decisions, challenges, and dissent. | Digest/target mismatch fails closed. | **RFC claims to address this problem. Assessment requires an authorized decision artifact.** |
| `/exchanges/:exchangeId/revisions/:revision` | Read one addressable entry with thread root, parent edge, correction chain, attribution, and request state. | Tombstoned content shows safe audit metadata; invalid references do not flatten the thread. | **Repository chronology and reply edges; activity is not quality or consensus.** |
| `/reviews/:reviewId` | Inspect exact attribution, targets, recommendation, disclosures, and response/correction links. | Unverified attribution remains explicit; invalid binding fails closed. | **Git-attributed; community standing not established.** |
| `/decisions/:decisionId` | Inspect transition authority, source state, exact target, rationale, evidence, and preserved dissent. | Invalid/stale decision is labeled rejected and has no projection effect. | **Only an accepted decision artifact may change displayed lifecycle state.** |

## Cross-route local draft journey

1. **Choose** one artifact type and exact target revisions.
2. **Draft** in memory; persistent header reads **Not published**.
3. **Validate** against schema, content policy, limits, references, and authority rules. Loading says **Validating locally**; invalid and quarantined outcomes never expose a download action.
4. **Preview** every canonical file, generated-index delta, fixed filename, and exact diff. The preview repeats **Not published**.
5. **Download** only after explicit consent. Download creates local files only; the success message says **Downloaded locally — not submitted or published.**

No step requests credentials, creates a branch or pull request, calls a remote endpoint, emits an active mention, or changes canonical state.

## Navigation and provenance rules

- Breadcrumbs include artifact kind, stable ID, and short revision; the accessible label exposes the full revision.
- Latest aliases link to immutable routes and never replace an exact revision in copied/exported references.
- Thread navigation offers **Parent**, **Thread root**, **Previous by chronology**, and **Next by chronology** independently.
- Filters may alter local view state but may not hide preserved dissent by default.
- Every count names what is counted (for example, **2 candidate RFC claims**) and is never styled as a quality score.

## Acceptance fixture handoff

The shared synthetic graph and state-by-state A6/A7 test targets are defined in [RFC exchange usability acceptance fixtures](rfc-exchange-usability-fixtures.md).
