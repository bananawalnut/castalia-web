# Issue #16 focused product and workflow review

- Delegation batch: `deleg_2d387995`
- Verdict: Request changes
- Preservation: Verbatim independent review report
- Status: Resolution paused at checkpoint; findings remain authoritative inputs to the feature design
- Naming note: the reviewed development artifact was then mislabeled “RFC 0001”; it is now the Issue #16 feature design. The report below is preserved verbatim.

# REQUEST CHANGES

1. **Directed specialist requests are not representable as directed requests.**  
   `ExchangeEntryV1` defines the actor, target, kind, prose, and requested next action, but no addressee or request mode (`open` versus `directed`) (RFC lines 142–153). Consequently, the named-specialist example can only be encoded as unstructured prose, and the board cannot reliably show “requests addressed to me,” unanswered invitations, acknowledgements, or declines.
   - **Fix:** Add structured `requested_actor_refs`, `request_mode: open | directed`, and a request lifecycle such as `open | acknowledged | answered | declined | withdrawn | superseded`.
   - State explicitly that acknowledgement is voluntary and never creates an assignment, obligation, endorsement, or authority relationship.
   - Add a Gate 2 fixture proving a named human or agent can be invited, answer or decline, and remain visibly distinct from an assignee.

2. **A solution claim has two competing representations and unclear status authority.**  
   `ProblemSolutionClaimV1` is correctly first-class, but `ExchangeEntryV1` also has `kind: solution_claim` (lines 127–151). The RFC does not say whether that exchange creates, embeds, or merely references the canonical solution claim. This permits a prose exchange to look like a solution claim without satisfying the claim contract. Status authority is also incomplete: authors cannot mark a claim “supported,” but control over `partially_supported`, `contested`, `candidate_solutions`, and other evaluative states is unspecified.
   - **Fix:** Make `ProblemSolutionClaimV1` the only canonical solution assertion. A `solution_claim` exchange must reference its exact ID and revision; export should atomically bundle both artifacts.
   - Define a transition matrix identifying author-controlled, derived, reviewer-triggered, and decision-record-only states. In particular, support/rejection states must require decision evidence, while `candidate_solutions` should be a neutral derived projection.
   - Require UI copy such as **“RFC claims to address this problem”**, never **“solution”** or **“solved,”** unless displaying a decision-backed problem state.

3. **Competing RFCs can be listed but not meaningfully compared.**  
   The RFC promises neutral competing-RFC views (line 163), yet the route model only provides candidate lists and individual detail pages (lines 165–174). No comparison workflow or normalized comparison contract is defined.
   - **Fix:** Add a problem-scoped comparison route, for example `/problems/:problemId/compare?claims=…`.
   - Compare exact `ProblemSolutionClaim` revisions across scope, criteria addressed/not addressed, mechanism, assumptions, evidence, counterevidence, limitations, risks, falsifiers, support status, unresolved challenges, and preserved dissent.
   - Keep ordering neutral and prohibit inferred ranking or winner selection.
   - Add a Gate 2 acceptance scenario where a reviewer selects at least two claims, compares them, and opens each claim’s challenges and dissent.

4. **Immutable artifacts and preserved dissent are not actually addressable through the proposed routes.**  
   The model promises immutable targets and addressable exchanges, with dissent remaining traversable (lines 142–159), but routes expose only mutable-looking `:problemId` and `:rfcId` pages. There are no canonical routes for exact revisions, solution claims, exchanges, reviews, or decision records. A latest-version page cannot satisfy citations to immutable targets or guarantee navigation to superseded dissent.
   - **Fix:** Define canonical routes such as:
     - `/problems/:problemId/revisions/:revision`
     - `/rfcs/:rfcId/revisions/:revision`
     - `/solution-claims/:solutionClaimId`
     - `/exchanges/:exchangeId`
     - `/reviews/:reviewId`
     - `/decisions/:decisionId`
   - Treat ID-only problem/RFC routes as clearly labeled latest-revision aliases.
   - Require every card, response, supersession, resolution, and dissent reference to resolve to an immutable permalink, including after closure or supersession.

5. **The minimum useful slice overstates publication and overloads its authoring routes.**  
   The summary/objectives say people and agents can “publish,” “submit,” and “answer” (lines 13–24), while the first slice can only create and export artifacts for a later human PR (lines 15, 176, 466–468). In addition, `/problems/:problemId/respond` combines exchanges and RFC solution claims, while `/rfcs/:rfcId/review` combines reviews, exchanges, and candidate revisions. These artifacts have materially different validation and disclosure requirements.
   - **Fix:** Describe Gate 2 consistently as **draft, validate, preview, and export**; publication occurs only after the repository PR is accepted.
   - Use an explicit action chooser or separate intent routes, e.g. `/respond`, `/claim-solution`, `/challenge`, and `/review`, while reusing a shared target selector.
   - Export a dependency-complete PR bundle with immutable targets, canonical paths, schema validation, attribution/disclosures, and a clear **“not yet published”** state.
   - Add end-to-end fixture journeys for problem submission, directed invitation/response, solution claim, challenge/counterexample, competing comparison, candidate revision, and preserved dissent.

## Positive findings

- The many-to-many problem/RFC relationship is correct.
- Requests are explicitly distinguished from assignments.
- Solution claims are correctly separated from solved status and WMT output.
- Challenges, counterexamples, rebuttals, supersession, and dissent are conceptually preserved.
- The repository-export boundary is safe and appropriate for the first slice once its product language is corrected.

## Review record

- Reviewed the exact RFC correction and adjacent peer-review record, including the working-tree diff.
- No files were created or modified.
- The exact first RFC-exchange post content was unavailable; this verdict assesses only the generic exchange model and does not invent that content.
