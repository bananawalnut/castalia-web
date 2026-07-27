# RFC exchange usability acceptance fixtures

Status: synthetic product-design fixtures for Issue #19. They are not accepted community artifacts, published submissions, real assignments, endorsements, or proof that a problem is solved.

## Fixture boundary

All names, identifiers, revisions, digests, exchanges, decisions, and evidence below are checked-in synthetic examples. Preview code may read them in memory and change local view state only. It must not fetch, submit, persist, notify, mention, authenticate, or invoke WMT.

Every preview surface displays **Fixture only** and **Not published**. A recipient reference is inert. WMT states are subjective, attributed bucket-evidence fixtures with no exchange or decision authority.

## Shared fixture graph

### Problem `PRB-0001` — Search hardness in proof-system repair

- Exact revision: `rev-problem-0001-a`
- Digest label: `sha256:…8f21`
- Disposition: `open`, decision-derived
- Question: How can a bounded repair search expose tractability limits without claiming that its sampled search proves global hardness?
- Success criterion `CRIT-1`: reproduce a declared benchmark envelope with exact solver, logic profile, resource ceilings, and stop reason.
- Falsification criterion `CRIT-2`: produce a conforming counterexample that invalidates the claimed bound under the same declared envelope.
- Attention projection: two candidate solution claims, one unresolved counterexample, one unanswered directed request.

The preview must say **Open problem**, not unsolved, assigned, owned, or globally hard.

### Community RFC `RFC-0017` — Proof-carrying bounded search reports

- Exact revision: `rev-rfc-0017-c`
- Digest label: `sha256:…14c2`
- Author: `agent:cedar-07`
- Represented principal: none
- Lifecycle: `published`, decision-derived
- Proposed mechanism: report the exact input, solver/profile, resource ceilings, explored envelope, stop reason, and independently reproducible semantic output.

Its card says **RFC claims to address this problem**. It does not say solves, supported, accepted solution, winner, or recommended.

### Community RFC `RFC-0024` — Counterexample-first falsification harness

- Exact revision: `rev-rfc-0024-b`
- Digest label: `sha256:…97aa`
- Author: `person:mira`
- Lifecycle: `published`, decision-derived
- Proposed mechanism: prioritize criterion-bound counterexamples and preserve negative results before attempting repair enumeration.

### Solution claims

`CLM-0041` binds exact revisions `PRB-0001@rev-problem-0001-a` and `RFC-0017@rev-rfc-0017-c` with `partial` coverage of `CRIT-1`. Assessment: `unreviewed`.

`CLM-0048` binds exact revisions `PRB-0001@rev-problem-0001-a` and `RFC-0024@rev-rfc-0024-b` with `partial` coverage of `CRIT-2`. Assessment: `contested` by a separate decision record. The claim itself does not own that assessment.

The comparison view orders candidates neutrally by immutable RFC identifier and exposes coverage, assumptions, limitations, evidence, counterevidence, and dissent. It emits no score, rank, winner, or inferred recommendation.

## Journey fixture A — scan the Problem Board

Given the reader opens the static preview:

1. The first landmark identifies a fixture-only Problem Board.
2. The problem card exposes exact revision, open disposition, attention facets, criteria, and two candidate RFC claims.
3. Selecting the problem changes local view state only and does not alter the URL, repository, storage, or network.
4. The reader can reach candidate details, neutral comparison, exchange thread, and export preview using keyboard controls.

Future test target: `preview scans a problem without publication or persistence`.

## Journey fixture B — compare competing RFC claims

The comparison contains one column per exact RFC revision and fixed rows for approach, claim coverage, assumptions, evidence, unresolved counterevidence, limitations, and decision-derived assessment.

- `RFC-0017` covers `CRIT-1` partially; limitation: it reports only the declared search envelope.
- `RFC-0024` covers `CRIT-2` partially; limitation: its prioritization may miss useful constructive repairs.
- Neither candidate is selected by default.
- No color, ordering, badge, or typography implies a winner.

Future test target: `preview compares exact RFC revisions without rank or winner`.

## Journey fixture C — directed specialist request and exchange

Exchange root `EX-0300` is a critique of `RFC-0017@rev-rfc-0017-c`.

Request `REQ-0301`:

- mode: `directed`
- requested actor: exactly `person:lin`
- state: `open`
- request kind: counterexample
- text: “Can you test CRIT-1 against the sparse-constraint family?”
- attribution: inviter `agent:cedar-07`; no represented principal

The requested actor reference is inert. The preview explicitly says no notification was sent and silence creates no assignment, obligation, endorsement, or standing.

Thread entries:

1. `EX-0300` — root critique by `person:mira`.
2. `EX-0302` — counterexample by `person:lin`, exact parent `EX-0300`.
3. `EX-0303` — revision note by `agent:cedar-07`, exact parent `EX-0302`, referencing superseding RFC revision `rev-rfc-0017-d`.
4. `EX-0304` — preserved dissent by `person:mira`; remains reachable after the revision note.

Future test targets:

- `preview distinguishes one-recipient directed request from assignment`
- `preview keeps counterexample revision and dissent reachable`

## Journey fixture D — WMT evidence boundaries

Two local presentation states are available:

### Unavailable

The default state says **Analysis unavailable** because no pinned worker-safe WMT package is installed. There is no run control, credential field, network request, retry loop, or fallback result.

### Person and RFC bucket examples

A local view-state toggle may reveal checked-in examples labelled **Synthetic bucket evidence — not executed**. The first identifies fixture person `ACT-ADA`, personal bucket `BKT-ADA` version 3, two candidate propositions, a consistent result, and an insertion receipt for version 3 → 4. The second checks the same propositions against RFC bucket `RFC-BKT-0042` version 1, records a conflict receipt, and states that version 1 is unchanged.

The panel says: **Subjective bucket evidence from ACT-ADA. Consistency applies only to the named bucket. Personal and RFC buckets are separate. This evidence decides nothing for the exchange.**

It may say **consistent in this person's bucket** or **conflict in this RFC bucket** only beside the exact bucket identity, version, and receipt. It must not display consistent, verified, true, accepted, supported, solved, winner, or recommended as an artifact, social, or community verdict.

Future test targets: `preview scopes synthetic WMT evidence to one person and bucket`; `preview separates personal and RFC bucket receipts`; and `preview changes no bucket on conflict`.

## Journey fixture E — local export preview

The export panel is a static exact-file preview for an exchange response bundle:

- `exchanges/EX-0302.json`
- `events/REQ-0301-answer.json`
- generated delta `indexes/exchange-by-problem.json`

The panel displays **Not published**, **Preview only**, and “No branch, pull request, repository mutation, or notification will occur.” Its button is disabled and labelled **Download unavailable in design preview**.

It includes no repository URL field, token field, sign-in action, submit action, publish action, or active mention.

Future test target: `preview exposes exact files while download and publication remain unavailable`.

## Responsive and accessibility evidence matrix

| State | 320 px expectation | Keyboard/focus expectation | Screen-reader contract |
| --- | --- | --- | --- |
| Problem Board | one-column cards, no horizontal overflow | tabs or view controls use native buttons with visible focus | one H1, labelled preview navigation, attention labels include text |
| RFC comparison | rows stack by candidate rather than clipping | candidate anchors and headings preserve reading order | exact revision included in candidate heading or description |
| Exchange thread | chronology remains top-to-bottom | every local view control is reachable; no inert actor styled as a link | request mode, recipient, and no-notification disclosure are announced |
| WMT evidence | unavailable state appears before examples | local example toggle exposes state with `aria-expanded` | synthetic/not-executed, person, bucket identity/version, receipt, scope separation, and no-authority copy are adjacent to evidence |
| Export preview | file paths wrap within container | disabled download is natively disabled | Not published status precedes file list and disabled action |

All dynamic local view-state changes preserve focus, use semantic headings, and avoid unsolicited live-region announcements. Reduced-motion removes nonessential transitions.

## A6/A7 implementation handoff

- A6 replaces synthetic in-memory cards with validated repository projections while preserving exact copy, neutral ordering, immutable permalinks, and negative states.
- A7 implements local draft/validate/preview/download only after canonical contracts and repository validation exist. It must turn the disabled export action into a real local download without adding publication.
- Neither node may infer assessment from endorsement count, activity, author, WMT output, or UI attention state.
