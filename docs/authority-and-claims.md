# Authority and claim ledger

Status: accepted authority contract from issue #9, preserving Historical issue #1 and issue #2 as provenance. Issue #9 supersedes the unresolved separate-registry target with the planned Castalia Control composition. This ledger does not grant upstream authority or prove live integration.

## Authority ledger

| Surface | Canonical authority | Castalia Web boundary |
| --- | --- | --- |
| Accounts, rooms, events, edits, redactions, membership, and participant-authorized sends | Matrix | Matrix remains canonical. Castalia Web is an unprivileged client. It receives no Synapse admin or appservice credentials and cannot replace Matrix truth. |
| Castalia authorization, challenge/replay policy, syndicate admission policy/status, revocation/discharge enforcement, and authority receipts | Castalia Control using Dregg authorization | This repository does not implement that service. A future unprivileged client may present exact-request wallet proof plus a wallet-held `dga1_` capability directly to it. |
| Infrastructure execution, including Zenith-hosted Matrix provisioning | The infrastructure provisioner; Hub may fill this role for Zenith-hosted resources | The provisioner alone holds cloud, DNS, Synapse-admin, signing, federation-admission, and deployment credentials. It is not the authorization source or Castalia lifecycle authority. |
| Product routes and presentation | `ZenithResearch/castalia-web` | The repository may define the unprivileged web experience, while displaying upstream states without turning them into authority. |
| Documentation interpretation | The precedence rules below | Prose cannot override Matrix truth, verified Dregg authority, accepted issue boundaries, or reviewed evidence. |

## Request/status-first lifecycle

Community creation is request/status-first, not an immediate creation claim:

1. `/create` may collect a future typed request but remains unavailable until its own implementation issue passes.
2. Castalia Control would issue the authoritative request identifier addressed by `/create/:requestId`; it is not a Matrix room identifier or success assertion.
3. The status surface would display Castalia Control states such as pending, authorized, denied, executing, succeeded, failed, or unavailable.
4. The infrastructure provisioner may act only after a valid Castalia Control authorization and must return typed execution evidence.
5. Success is not established until Castalia Control status, provisioner evidence, and required Matrix evidence agree.

No live request submission, Castalia Control integration, provisioning, or authoritative status endpoint exists. The example request endpoint is a deterministic fixture read only.

## Implemented fixture routes and APIs

The current repository implements deterministic fixture routes, read-only fixture BFF endpoints, canonical contract sources, and visible unavailable states. These surfaces are fixture-only. They do not establish live Matrix access, wallet authentication, Dregg capability verification, Castalia Control lookup or mutation, provisioning, participant-authorized sends, deployment, or production readiness.

## Forum posture

Under current evidence, the Zenith forum is **visible unavailable**. The implemented fixture shell keeps `/community/:slug/forum` visible for orientation and navigation and clearly labels it unavailable. It does not imply that a room is readable, joinable, authenticated, writable, federated, or even known to exist.

## Deferred interpretation

AI interpretation is deferred from the basic MVP. If later authorized, interpretation must remain derived, non-authoritative output with provenance and privacy controls. It cannot mutate Matrix events, membership, Castalia Control state, or participant-authorized sends; it cannot be presented as the original conversation or as a canonical community judgment. No interpreter repository or implementation is created here.

## Documentation precedence

When documents conflict, use this order:

1. Live upstream authority for its own domain: Matrix for Matrix state; anchored Dregg authority and Castalia Control for Castalia authorization/admission state; the infrastructure provisioner for authorized execution evidence.
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
| Castalia creation/admission uses request/status-first semantics | Contract only | Castalia Control contract plus later implementation, anchored-authority, provisioner, and verification issues. |
| Castalia Control is the planned Dregg authorization/admission service | Authority boundary, not implementation | [Castalia Control authority boundary](castalia-control-authority.md); no connectivity exists here. |
| Hub may be provisioner-only for privileged Zenith-hosted changes | Authority boundary | Infrastructure provisioner contract; no provisioning exists here. |
| Zenith forum is visible unavailable | Implemented fixture posture | Issue #2 route/browser evidence proves the unavailable copy and navigation; any later live-access issue must preserve that posture until its own access evidence passes. |
| AI interpretation | Deferred and non-authoritative | A future explicitly authorized issue, privacy/provenance contract, implementation, tests, and deployment evidence. |
| Production readiness | Not claimed | Future QA, security, deployment, and live-target evidence gates. |

## Explicit non-claims

This repository does not currently claim:

- live or privileged application routes, APIs, or upstream connectivity beyond the deterministic fixture implementation;
- live Matrix reading, discovery, joining, authentication, posting, membership, federation, or live rooms;
- Synapse admin/appservice authority or credentials;
- implementation or deployment of Castalia Control or anchored Dregg authority;
- wallet proof, `dga1_` custody/presentation, request submission, status retrieval, community or room provisioning;
- AI interpretation, canonical summaries, or an interpreter repository;
- infrastructure, deployment, security approval, or production readiness.
