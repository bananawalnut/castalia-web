# RFC exchange responsive wireframes and component/state inventory

Companion to [journeys and information architecture](rfc-exchange-ux-journeys.md). These structures specify behavior and reading order, not a production visual design. Issue #19 implements only `/docs/rfc-exchange/preview`.

## Responsive layout contract

Breakpoints describe layout changes, not device classes:

- **Wide (≥ 960px):** 12-column content grid; board rail 4 columns and detail 8 columns; comparison columns may sit side by side.
- **Medium (600–959px):** 8-column grid; filters use a horizontal wrapping row; detail regions stack.
- **Narrow (320–599px):** one column; no horizontal document overflow at 320 CSS px or 400% zoom; tables become labeled definition rows or scroll within a named region without clipping page actions.

DOM and focus order are identical across breakpoints. CSS reflow never moves the primary action ahead of its heading or disclosure. Sticky elements may not cover focused content. Identifiers wrap with `overflow-wrap:anywhere`; buttons and filters wrap rather than shrink below a 44 × 44 CSS px target.

## Board wireframes

### Wide

```text
┌ Problem Board ──────────────────────────────────────────────────────────────┐
│ Fixture/source disclosure                    [Draft locally — Not published]│
│ [All] [Open calls] [Requested to me] [Unanswered] [Contested] [Dormant]    │
├ Problems (4 cols) ───────────┬ Selected exact revision (8 cols) ───────────┤
│ title + PROB/revision        │ Latest-route / immutable-revision banner     │
│ disposition + attention     │ Problem definition + criteria + evidence     │
│ requested actions           │ Candidate RFC claims                         │
│ candidate/contest counts    │ Exchange thread + preserved dissent          │
│ …                            │ [Choose response]                            │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

### Narrow

```text
Problem Board
Fixture/source disclosure
[Draft locally — Not published]
Filters (wrapping buttons)
Problem card
  exact revision
  disposition + text attention labels
  requested actions and named counts
Selected exact revision
  immutable/latest banner
  definition
  candidate RFC claims
  exchange
  preserved dissent
[Choose response]
```

The selected card uses `aria-current="true"`; selection updates local view state only. At narrow widths, the selected detail follows the list and receives focus only after an explicit **Open details** action, never on filter changes.

## RFC detail wireframes

### Wide

```text
┌ RFC-0142 / revision 3 ─────── In review (decision-backed) ──────────────────┐
│ Immutable revision · digest · attribution · [Draft review — Not published] │
├ Main (8 cols) ─────────────────────┬ On this revision (4 cols) ─────────────┤
│ Source summary                     │ Solution claims                         │
│ Claim coverage and approach role   │ Exchange thread                        │
│ Formalization readiness            │ Counterexamples                        │
│ WMT evidence / unavailable panel   │ Candidate revision                      │
│ Reviews and preserved dissent      │ Exact revision navigation               │
└────────────────────────────────────┴─────────────────────────────────────────┘
```

### Narrow

Reading order is header → source → solution claims → formalization → WMT → exchange → counterexamples → candidate revisions → reviews → preserved dissent → local action. A local section switcher may collapse visuals, but all content remains reachable and headings remain in DOM order.

## Neutral comparison wireframes

### Wide

```text
Neutral comparison — no score, rank, winner, or recommendation
Exact fields          RFC A / claim rev 2       RFC B / claim rev 1
Coverage              partial                   partial
Approach role         experiment                mitigation
Criteria addressed    C-01                      C-01, C-03
Not addressed         C-02, C-03                C-02
Mechanism             …                         …
Evidence               …                         …
Counterevidence        [open 1]                  [open 2]
Limitations / risks    …                         …
Falsifiers             …                         …
Decisions              unreviewed                unreviewed
Preserved dissent      [read]                    [read]
```

At narrow widths each field becomes a group with the same RFC order repeated. The initial order is query order; users can reverse it locally through **Swap display order**. No ordering option is named “best,” “top,” or “recommended.”

## Exchange thread wireframes

Entries render in repository chronology with visible reply indentation limited to one visual step. Structural depth is communicated by labels and links, not increasingly narrow columns.

```text
Directed request · unanswered
To: Synthetic specialist reference (inert; no active mention)
Invitation — not assignment, endorsement, obligation, or notification.
Requested action: attack the hardness assumption
[Thread root] [Parent]

↳ Counterexample · human-authored
  exact target + source locator + body
  [Parent] [Next by chronology]

↳ Candidate revision · separate canonical artifact
  Responds to counterexample; original remains available

Preserved dissent
  attributed text + exact review revision
```

Open requests show **Open request · no recipient**. Directed requests show **Directed request · one inert recipient**. Actor-oriented matches show **Addressed to your verified actor reference — not assigned**.

## Local draft/export wireframe

```text
Not published
1 Choose → 2 Draft → 3 Validate → 4 Preview → 5 Download
[Error summary, when invalid]
Artifact fields / exact targets
Validation result (polite live region)
Bundle preview
  fixed filename
  files (canonical paths)
  generated index deltas
  exact textual diff
[Download local bundle] (available only when valid and consent checked)
Downloaded locally — not submitted or published.
```

Quarantined and invalid states never render a download control. Loading has a cancel action; cancellation restores focus to **Validate locally**. Issue #19's static preview demonstrates the final preview but performs no download.

## Component inventory

| Component | Required semantics and variants |
| --- | --- |
| `RevisionHeader` | One page heading, stable ID, full accessible revision, digest, attribution label, immutable/latest-alias variant, and lifecycle source. Latest alias links its exact permalink. |
| `DisclosureBanner` | `fixture`, `not-published`, `unverified`, `unavailable`, `quarantined`; text and icon, never color alone. |
| `LifecycleBadge` | Shows only decision-backed disposition/assessment plus accessible source link. Never combines attention. |
| `AttentionBadge` | `open-call`, `unanswered`, `contested`, `unresolved-counterexample`, `dormant`; always says **Derived attention** in accessible description. |
| `ProblemCard` | Exact revision, statement excerpt, criteria count, named request/claim/challenge counts, explicit **Open details**. |
| `SolutionClaimCard` | Canonical wording, exact problem/RFC targets, `full/partial` coverage, approach role, criteria addressed/not addressed, limitations/falsifiers, assessment source. |
| `RequestModeLabel` | Open: zero recipients. Directed: exactly one inert recipient. Persistent no-assignment/no-notification copy. |
| `ActorAttribution` | Human-authored, agent-authored, or agent-assisted text label; represented-principal verification shown separately. |
| `ThreadNavigator` | Root, parent, chronology previous/next, correction/supersession links; preserves old text and dissent. |
| `ExchangeEntryCard` | Kind, exact revision, attribution, target, chronology, reply edge, body, evidence links, request state. |
| `DissentPanel` | Permanently discoverable heading and attributed entries; no “defeated” state without a separate authorized artifact. |
| `ComparisonField` | One field across exact claims with identical labels/order; links to challenges, decisions, counterexamples, dissent; no aggregate score. |
| `WmtEvidencePanel` | Attributed person, personal bucket identity and pre/post versions, candidate propositions, consistency result, insertion or conflict receipt, optional separately versioned RFC-bucket receipt, logic profile, limits, engine/solver identities, source digest, and non-authority copy; text/table alternative. |
| `StatePanel` | `empty`, `loading`, `invalid`, `quarantined`, `unavailable`; heading, bounded explanation, recovery action, live announcement policy. |
| `ErrorSummary` | Focused after failed validation; links each error to its field; pluralized count; no data leaves page. |
| `BundlePreview` | **Not published**, fixed filename, canonical path list, generated deltas, exact diff, byte/artifact ceilings, explicit local-only disclosure. |
| `LocalViewTabs` | Buttons or links with selected state; controls visibility only, not persistent state. |

## State matrix

| State | Rendered behavior | Primary/recovery action | Prohibited implication |
| --- | --- | --- | --- |
| Empty list | Named filter context and count zero. | Clear filters / browse all. | No demand, inactivity, or low quality. |
| Loading | Skeletons are `aria-hidden`; existing heading remains; polite **Loading checked fixture data** announcement. | Cancel where work is user-started. | No remote fetch unless route contract explicitly allows it. |
| Invalid | Fail-closed summary; hide dependent projections and exports. | Return to source / correct named fields. | No partial acceptance. |
| Quarantined | Safe metadata and reason class only; unsafe body and bundle absent. | Review policy / discard local draft. | No moderation verdict beyond supplied authority artifact. |
| Unavailable | Source/review remains usable; state names missing capability. | Continue without analysis / retry locally if permitted. | Unknown is not consistent; absence is not failure of RFC. |
| WMT person-scoped evidence | Labels the attributed person, selected bucket, exact pre-run version, formalization, and exclusions on every result. | Inspect formalization and bucket scope. | No approval/rejection, truth, consensus, or claim about another bucket. |
| WMT insertion receipt | Displays consistent propositions and the exact personal or RFC bucket version transition. Personal and RFC receipts remain separate. | Inspect propositions and version transition. | Consistency means insertable in that bucket only; it is not peer review or authority. |
| WMT conflict receipt | Displays conflicting propositions and confirms that the named bucket version did not change. | Inspect conflict set. | No silent insertion, cross-bucket inference, approval/rejection, or truth claim. |
| WMT reproduced receipt | Displays exact locked regeneration evidence beside the original person and bucket scope. | Inspect provenance. | Reproduction verifies bytes and computation only; it does not create truth, consensus, recommendation, or decision authority. |
| Superseded | Prior revision and successor link both remain. | Open exact successor. | Prior text is not erased. |
| Preserved dissent | Attributed entry remains in default traversal. | Read exact dissent revision. | Not defeated, resolved, or lower-ranked. |

## Motion and visual-state rules

- No essential content appears only through animation or hover.
- Local panel transitions are ≤ 150 ms opacity only and disabled under `prefers-reduced-motion: reduce`.
- Status palettes meet WCAG AA and use text/icons in addition to color.
- WMT `compatible` must not use success language or a standalone green treatment; label it **Compatible formalization result** beside the non-truth warning.
