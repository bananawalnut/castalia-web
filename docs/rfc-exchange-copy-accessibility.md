# RFC exchange interaction copy and accessibility contract

Normative product copy and WCAG 2.2 AA interaction requirements for Issue #19 and downstream A6/A7 implementation.

## Exact copy and authority rules

### Always-visible disclosures

| Context | Required copy |
| --- | --- |
| Issue #19 preview | **Synthetic fixture preview. Local view controls only; nothing is submitted, published, saved, or sent.** |
| Local draft/export | **Not published** |
| Solution claim | **RFC claims to address this problem** |
| Directed request | **Directed request to one inert recipient. Invitation — not assignment, endorsement, obligation, or notification.** |
| Open request | **Open request. No recipient and no notification.** |
| Neutral comparison | **Neutral comparison — no score, rank, winner, or recommendation.** |
| Latest route | **Latest-route alias — currently resolves to revision {revision}.** |
| Immutable route | **Immutable revision** |
| Agent without verified delegation | **Self-declared agent; no principal authority established.** |
| Git-attributed review | **Git-attributed; community standing not established.** |
| WMT evidence | **Consistency of the confirmed formalization, not truth or community consensus.** |
| WMT subsets | **Computed compatible subsets are not human or minority positions.** |
| WMT unknown | **Unknown is not consistent.** |
| WMT action boundary | **This analysis does not approve, reject, fund, or execute the RFC.** |
| WMT unavailable | **Analysis unavailable. Continue with source and human review; no remote fallback was attempted.** |
| Local download completion | **Downloaded locally — not submitted or published.** |

### Allowed lifecycle language

Use only the value produced by the accepted projection and name its source:

- **Problem disposition: Open — from decision DR-…**
- **Problem assessment: Unassessed** or **Solved under criteria C-… — from decision DR-…**
- **RFC disposition: Draft / In Review / Accepted / Rejected / Withdrawn / Superseded — from decision DR-…**
- **Solution assessment: Unreviewed / Partially supported / Supported under criteria / Rejected under criteria — from decision DR-…**
- **Request state: Open / Acknowledged / Answered / Declined / Withdrawn / Superseded — derived from accepted request events.**

“Closed” must be followed nearby by **Closed does not mean solved.** “Solved under criteria” must include the exact criterion IDs, decision link, unresolved counterevidence, and preserved dissent.

### Copy grammar

- Prefer actor + source + bounded state: **One accepted answer event from the requested actor**.
- Say **claims**, **proposes**, **records**, **compares**, or **provides evidence for** rather than asserting an outcome.
- Name exact artifacts and revisions; do not use “current” in exports.
- Counts name nouns and provenance: **2 unresolved counterexample entries**, not **2 objections** or **risk score 2**.
- Use **recipient** or **requested actor**, never **assignee**.
- Use **candidate RFCs** or **competing RFCs** only to describe alternatives addressing the same problem, never to imply a contest outcome.
- Active mention syntax is forbidden in displayed fixtures and exports. Render an inert label such as **Synthetic specialist (ACTOR-SPECIALIST-EXAMPLE)** without an `@` prefix.

### Forbidden claim families

Copy, accessible names, metadata, tooltips, test IDs, and CSS labels must not imply:

- “solved,” “solution,” or “fixed” without the exact bounded decision-backed wording **Solved under criteria**;
- winner, winning, best, top, leading, recommended, preferred, superior, score, rank, leaderboard, or quality ordering;
- assigned, owner, responsible, due, obligation, accepted request, or notified for an invitation;
- endorsed, approved, accepted, rejected, consensus, verified truth, coherent truth, valid proposal, or community-supported unless an exact accepted authority artifact permits the bounded lifecycle wording;
- WMT decided, proved true, verified the RFC, chose a subset, found the human position, or recommended repair;
- submitted, published, synced, saved, branch created, pull request opened, message sent, or mention emitted from any local-only action.

Negative disclosures may contain forbidden concepts only to deny them, as in **no score, rank, winner, or recommendation**.

## Keyboard contract

- All controls work with keyboard alone in logical DOM order. No positive `tabindex`.
- The first focusable element is **Skip to content**. Activation focuses `<main tabindex="-1">` without scrolling its heading beneath sticky UI.
- Route changes focus main; local filter/view changes preserve focus on the initiating control and announce the result count.
- Button semantics are used for local state changes; links are used only for navigation. No clickable `div` or synthetic keyboard emulation.
- Tab/Shift+Tab reach every action once. Enter activates links/buttons; Space activates buttons and checkboxes.
- Comparison reordering uses explicit **Move RFC A before RFC B** buttons; drag is optional and never the only method.
- Escape closes a non-modal disclosure/popover and returns focus to its trigger. Dialogs, if downstream adds them, trap focus only while open and restore focus on close.
- Long thread navigation offers a **Skip exchange thread** link and does not require traversing every reply action.

## Focus management

- Visible focus indicator is at least 2 CSS px, has a 1 CSS px separation or equivalent area, and reaches 3:1 contrast against adjacent colors.
- Filtering that removes the focused item moves focus to the filter summary, not `<body>`.
- Failed validation focuses `ErrorSummary`; each summary link focuses the invalid field and retains the error association.
- Starting local analysis or validation keeps focus on the initiating button. Completion/failure/cancellation returns focus there after the live announcement unless the user moved focus.
- A newly selected board item does not steal focus. Explicit **Open details** focuses the detail heading.
- Disabled controls remain accompanied by visible text explaining why. Prefer omission when no discovery value exists.

## Heading, landmark, and naming contract

- Exactly one `<main>` and one page `<h1>`.
- Sections descend without skipped levels: Problem definition, Candidate RFCs, Exchange, WMT evidence, Reviews, Preserved dissent.
- Repeated cards use headings. Each card's accessible name contains artifact kind, human title, stable ID, and short revision.
- One primary navigation landmark; additional navigation regions have unique labels such as **Thread** and **Revision**.
- Breadcrumbs are `<nav aria-label="Breadcrumb">` with an ordered list and `aria-current="page"`.
- Status uses text in reading order; `aria-label` must not replace useful visible copy.
- Full hashes/IDs are available to assistive technology without forcing every character to be pronounced in the heading; provide a short visible value and a named **Copy full revision** control only when copying is implemented.

## Live-region contract

Use one visually discoverable `role="status" aria-live="polite" aria-atomic="true"` for noncritical local progress. Use the focused error summary, not an assertive region, for validation failures.

Announce once per transition:

- **Showing {count} problems for {filter}.**
- **Validating locally.**
- **Validation complete. {count} files ready to preview. Not published.**
- **Validation failed. {count} errors. Nothing was published.**
- **Analysis running locally.**
- **Analysis complete: {bounded semantic status}.**
- **Analysis unavailable. Continue with source and human review.**
- **Analysis cancelled. No partial result was retained.**
- **Analysis status unknown. Unknown is not consistent.**
- **Enumeration capped. Reported sets are partial.**

Do not announce every skeleton, elapsed-time tick, expanded reply, or repeated identical result. `aria-busy` belongs on the region being updated, not the entire page.

## Error and state accessibility

- Field errors are visible text, associated with `aria-describedby`, and use `aria-invalid="true"` only after validation.
- Error summary title: **There are {count} problems with this local draft**. Summary intro: **Nothing was submitted or published.**
- Empty states remain under the result-region heading and state the active filters.
- Invalid source state hides dependent projections and identifies the failed binding without rendering unsafe payload.
- Quarantine renders a safe reason category and no artifact-controlled body, links, images, HTML, or download action.
- Loading placeholders are ignored by assistive technology; a textual status conveys progress.
- Unavailable analysis leaves source and human review landmarks present and usable.

## Contrast, color, and typography

- Normal text meets 4.5:1; large text meets 3:1; controls, focus, icons carrying meaning, and graph strokes meet 3:1.
- Lifecycle, attention, WMT, error, and attribution states use visible words and optionally icons; color is never the only differentiator.
- `compatible` WMT evidence must not use a conventional success-only green treatment.
- Text supports 200% browser text zoom and 400% page zoom without loss, overlap, or two-dimensional page scrolling at a 320 CSS px equivalent viewport.
- Line length targets 45–80 characters for prose. Users can increase line/paragraph spacing without clipping.
- IDs, paths, and code wrap or use a named, keyboard-scrollable contained region.

## Motion and reduced-motion

- Respect `prefers-reduced-motion: reduce`; disable smooth scrolling, animated progress, parallax, and nonessential transitions.
- No flashing content and no animation triggered solely by pointer movement.
- Auto-updating content is absent. If later added, it needs pause/stop and user-controlled frequency.
- Local view changes should be immediate; optional opacity transition is at most 150 ms and has no spatial motion.

## Screen-reader and alternate-representation contract

- Graphs and relationship diagrams always have a complete adjacent list/table representation with identical artifacts, edge types, and states.
- Comparison reading order groups by field, then RFC in stable display order; an introductory sentence announces that order.
- Exchange reply indentation is decorative; explicit **Replies to…**, parent, and thread-root links expose structure.
- Human-authored, agent-authored, and agent-assisted are literal visible labels and part of each entry's accessible name.
- Preserved dissent is a named section and appears in route search/navigation; it cannot be visually or semantically collapsed into “resolved comments.”
- Icons are hidden when adjacent text carries the meaning; standalone icon buttons require unique visible tooltips and accessible names.

Representative manual checks: VoiceOver + Safari on macOS/iOS, NVDA + Firefox or Chrome on Windows, and TalkBack + Chrome on Android. Automated axe checks are necessary but do not replace these checks.

## Acceptance checks for A6/A7

1. Keyboard-only journey from board → exact revision → directed request draft → validation error → bundle preview → local download.
2. 320 px and 400% reflow with no page-level horizontal overflow or obscured focus.
3. Focus restoration for route changes, validation, cancellation, and local selection.
4. Screen-reader traversal of one problem, two competing claims, a reply edge, counterexample, candidate revision, and preserved dissent.
5. Text/table alternative parity for comparison and WMT structure.
6. Reduced-motion and forced-colors/high-contrast inspection.
7. Exact-copy assertions for all authority boundaries and forbidden-claim scan that understands negative disclosures.
8. Axe WCAG 2.2 AA scan with no serious/critical findings, followed by manual landmark/name/description review.
