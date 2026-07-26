# Issue #16 exact-head product review at cef7e5d

- Delegation batch: `deleg_603a0786`
- Reviewed commit: `cef7e5d9a9aafcdd61154b33a68a164eb64a056d`
- Preservation: Verbatim independent review report

# REQUEST CHANGES

Exact-head review performed at clean commit `cef7e5d9a9aafcdd61154b33a68a164eb64a056d`.

## Blocking finding — P1 directed-request lifecycle is not deterministically representable

The request itself is now structured correctly:

- open/directed mode;
- inert requested actors;
- requested next action;
- voluntary acknowledgement/decline;
- no assignment, obligation, endorsement, notification, or authority implication.

However, the lifecycle transitions are not backed by a defined canonical artifact:

- `ExchangeEntryV1.kind` has no acknowledgement, answer, decline, or withdrawal event kinds (§ExchangeEntryV1, lines 156–168).
- The transition table merely says “typed response/event” without defining its contract (line 198).
- A child exchange cannot deterministically distinguish an answer from a comment, critique, or clarification.
- Up to eight recipients are allowed (line 510), but only one aggregate request state is defined. Conflicting recipient actions—such as one declining while another acknowledges—have no deterministic projection.
- Addressee matching and delegated-agent authorization for lifecycle events are not specified.

Consequently, CI and generated indexes cannot reproducibly derive `acknowledged`, `answered`, `declined`, or `withdrawn`, and the board cannot reliably implement “requests addressed to me” or “unanswered directed invitations.”

### Exact fixes required

1. Define a canonical immutable `ExchangeRequestEventV1`—or equivalent explicit exchange event kinds—with:
   - immutable event identity/revision/digest;
   - exact request revision and digest;
   - `event_kind: acknowledge | answer | decline | withdraw`;
   - actor attribution and delegation evidence;
   - exact answer-exchange reference when `event_kind: answer`;
   - idempotency and supersession rules.

2. Define validation and authority rules:
   - `open` requests have no requested actors;
   - `directed` requests have one or more inert requested actors;
   - acknowledge/decline events must come from a requested actor or a policy-verified delegate;
   - withdrawal comes only from the inviter;
   - correction/supersession remains same-author;
   - stale-target and conflicting events fail closed.

3. Either:
   - derive state independently per recipient and define a deterministic aggregate state, **or**
   - constrain each directed request to exactly one recipient.

4. Extend the Gate 2 fixture to prove separate immutable exported artifacts for request → acknowledgement/answer/decline/withdrawal, followed by deterministic projections after repository acceptance from both problem and actor-oriented views.

## P2–P5 verification

- **P2 — Pass:** `ProblemSolutionClaimV1` is the sole canonical solution assertion; exchanges may only reference it. Assessment and solved state require decisions, and UI copy remains “RFC claims to address this problem.”
- **P3 — Pass:** Exact-revision, problem-scoped comparison covers criteria, mechanism, evidence, risks, challenges, decisions, and dissent without ranking or winner selection.
- **P4 — Pass:** Immutable problem, RFC, solution-claim, exchange, review, and decision routes are defined; latest aliases are labeled, and superseded artifacts and dissent remain reachable.
- **P5 — Pass:** Gate 2 is consistently local draft/validate/preview/download only, with dependency-complete bundles, explicit **Not published** copy, no credentials, notifications, branches, PR calls, or mutation endpoints.
- **User requirement:** The problem/RFC exchange and non-self-solving solution-claim model are sound, but the directed-request exchange requirement remains incomplete until the lifecycle event contract above is defined.

**Files created or modified:** None.  
**Issues encountered:** None.
