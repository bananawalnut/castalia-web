# Authority and claim ledger

Status: accepted authority contract from issue #1, reconciled with the fixture-only implementation merged by issue #2. This ledger does not grant upstream authority or prove live integration.

## Authority ledger

| Surface | Canonical authority | Castalia Web boundary |
| --- | --- | --- |
| Accounts, rooms, events, edits, redactions, membership, and participant-authorized sends | Matrix | Matrix remains canonical. Castalia Web is an unprivileged client. It receives no Synapse admin or appservice credentials and cannot replace Matrix truth. |
| Zenith-hosted Matrix provisioning | Hub's privileged adapter | Hub may adapt an authorized request into hosted-resource provisioning. The adapter is not the community registry and does not make Castalia Web privileged. |
| Community identity, descriptor, and lifecycle status | Independently owned canonical community registry | This repository does not own, define, or provision the registry. A future web client may consume its authorized contract. |
| Product routes and presentation | `ZenithResearch/castalia-web` | The repository may define the unprivileged web experience, while displaying upstream states without turning them into authority. |
| Documentation interpretation | The precedence rules below | Prose cannot override Matrix truth, the registry, accepted issue boundaries, or verified evidence. |

## Request/status-first lifecycle

Community creation is request/status-first, not an immediate creation claim:

1. `/create` may collect and submit a future authorized request.
2. A registry-owned request identifier—not a room identifier or success assertion—would address `/create/:requestId`.
3. The status surface would display registry-provided states such as pending, accepted, failed, or unavailable.
4. Hub's adapter may act only after the independently owned registry and its authorized workflow permit it.
5. Success is not established until authoritative registry status and required Matrix/provisioning evidence agree.

No live request submission, registry integration, provisioning, or registry status endpoint exists. The example request endpoint is a deterministic fixture read only.

## Implemented fixture routes and APIs

The current repository implements deterministic fixture routes, read-only fixture BFF endpoints, canonical contract sources, and visible unavailable states. These surfaces are fixture-only. They do not establish live Matrix access, authentication, registry lookup or mutation, provisioning, participant-authorized sends, deployment, or production readiness.

## Forum posture

Under current evidence, the Zenith forum is **visible unavailable**. A future shell may keep `/community/:slug/forum` visible for orientation and navigation, but it must clearly say unavailable. It must not imply that a room is readable, joinable, authenticated, writable, federated, or even known to exist.

## Deferred interpretation

AI interpretation is deferred from the basic MVP. If later authorized, interpretation must remain derived, non-authoritative output with provenance and privacy controls. It cannot mutate Matrix events, membership, registry state, or participant-authorized sends; it cannot be presented as the original conversation or as a canonical community judgment. No interpreter repository or implementation is created here.

## Documentation precedence

When documents conflict, use this order:

1. Live upstream authority for its own domain: Matrix for Matrix state; the independently owned registry for community lifecycle state.
2. Accepted issue decisions and reviewed evidence for this repository's bounded scope.
3. This authority and claim ledger, then the product boundary.
4. README summaries and future UI copy.

Lower-precedence text must be corrected; it cannot broaden a higher-precedence authority or claim. Plans describe intended work only. Implementation, tests, deployment evidence, and an owning issue gate are required before planned capabilities can be described as available.

## Claim ledger

| Claim or posture | Current status | Evidence gate / owner |
| --- | --- | --- |
| Product routes and navigation contract are defined | Implemented fixture claim | Issues #1 and #2, the route shell, and route/browser checks; no live upstream behavior claimed. |
| Fixture BFF and canonical contract sources exist | Implemented fixture claim | Issue #2, local/hosted verification, and checked-in OpenAPI/JSON Schema sources; no deployed API claimed. |
| Matrix is canonical for Matrix state and authorized sends | Authority boundary | Matrix; this repository remains unprivileged. |
| Community creation uses request/status-first semantics | Contract only | Independently owned registry contract plus later implementation and verification issues. |
| Hub is adapter-only for privileged hosted provisioning | Authority boundary | Hub adapter contract; no provisioning exists here. |
| Zenith forum is visible unavailable | Required present posture | A later UI issue must preserve the unavailable copy and navigation until access evidence passes. |
| AI interpretation | Deferred and non-authoritative | A future explicitly authorized issue, privacy/provenance contract, implementation, tests, and deployment evidence. |
| Production readiness | Not claimed | Future QA, security, deployment, and live-target evidence gates. |

## Explicit non-claims

This repository does not currently claim:

- live or privileged application routes, APIs, or upstream connectivity beyond the deterministic fixture implementation;
- live Matrix reading, discovery, joining, authentication, posting, membership, federation, or live rooms;
- Synapse admin/appservice authority or credentials;
- ownership or implementation of the canonical community registry;
- request submission, status retrieval, community or room provisioning;
- AI interpretation, canonical summaries, or an interpreter repository;
- infrastructure, deployment, security approval, or production readiness.
