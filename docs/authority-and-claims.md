# Authority and claim ledger

Status: accepted authority contract from issue #9, preserving Historical issue #1 and issue #2 as provenance. Issue #9 supersedes the unresolved separate-registry target with the planned Castalia Control composition. This ledger does not grant upstream authority or prove live integration.

## Authority ledger

| Surface | Canonical authority | Castalia Web boundary |
| --- | --- | --- |
| Accounts, rooms, events, edits, redactions, membership, and participant-authorized sends | Matrix | Matrix remains canonical. Castalia Web is an unprivileged client. It receives no Synapse admin or appservice credentials and cannot replace Matrix truth. |
| Castalia authorization, challenge/replay policy, syndicate admission policy/status, revocation/discharge enforcement, and authority receipts | Castalia Control using Dregg authorization | This repository does not implement that service. Its unprivileged Web client may send exact enrollment-v2 wallet proof directly to configured Control; a later capability-bearing operation using a wallet-held `dga1_` remains separate. |
| Infrastructure execution, including Zenith-hosted Matrix provisioning | The infrastructure provisioner; Hub may fill this role for Zenith-hosted resources | The provisioner alone holds cloud, DNS, Synapse-admin, signing, federation-admission, and deployment credentials. It is not the authorization source or Castalia lifecycle authority. |
| Product routes and presentation | `bananawalnut/castalia-web` | The public repository may define and deploy the unprivileged fixture web experience, while displaying upstream states without turning them into authority. |
| Documentation interpretation | The precedence rules below | Prose cannot override Matrix truth, verified Dregg authority, accepted issue boundaries, or reviewed evidence. |

## Request/status-first lifecycle

Community creation is request/status-first, not an immediate creation claim:

1. `/spaces/new` and `/spaces/:spaceId/rooms/new` expose future creation intent but remain unavailable until their own implementation issues pass.
2. A future Castalia Control request identifier would remain distinct from a Space identifier, room identifier, or success assertion; no request/status route is currently retained.
3. The status surface would display Castalia Control states such as pending, authorized, denied, executing, succeeded, failed, or unavailable.
4. The infrastructure provisioner may act only after a valid Castalia Control authorization and must return typed execution evidence.
5. Success is not established until Castalia Control status, provisioner evidence, and required Matrix evidence agree.

The `/start` client now implements the challenge and application HTTP contracts, but the public deployment is unconfigured and the currently integrated Control service lacks the application endpoint. No deployed end-to-end submission, authoritative status endpoint, admission decision, or provisioning exists.

## Implemented fixture routes and APIs

The current repository implements deterministic fixture routes, read-only fixture BFF endpoints, canonical contract sources, visible unavailable content states, a static GitHub Pages deployment, and the Web edge of permissionless Wallet-to-Dregg membership Join. Existing content surfaces remain fixture-only. Local Join can display a Wallet-verified Active v2 membership, but it does not establish an authenticated Web session, production-deployed membership service, live Matrix access, Dregg capability authority, provisioning, participant-authorized sends, or production readiness.

## Commons room posture

Under current evidence, The Commons is **visible unavailable** at `/room/zenith`. The retained fixture room is reachable from the Zenith Space and clearly labels messages, membership, and connection unavailable. It does not imply that a room is readable, joinable, authenticated, writable, federated, or even known to exist upstream.

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
| Castalia creation/admission uses request/status-first semantics | Web submission client implemented; authority and status unavailable | The Web client can submit only after local proof verification. Control application processing, status, anchored authority, provisioner work, and lifecycle evidence remain required. |
| Castalia Control is the Dregg authorization/admission service | Authority boundary; external service not implemented here | [Castalia Control authority boundary](castalia-control-authority.md); Web has a direct client contract, but the public deployment is unconfigured and end-to-end application processing is unavailable. |
| Enrollment-v2 Wallet holder proof is independently verified before Web submission | Implemented local client claim | Rust/WASM fixed-vector and tamper tests plus WebCrypto verification; Control must repeat verification and consume replay state authoritatively. |
| Hub may be provisioner-only for privileged Zenith-hosted changes | Authority boundary | Infrastructure provisioner contract; no provisioning exists here. |
| Zenith forum is visible unavailable | Implemented fixture posture | Issue #2 route/browser evidence proves the unavailable copy and navigation; any later live-access issue must preserve that posture until its own access evidence passes. |
| AI interpretation | Deferred and non-authoritative | A future explicitly authorized issue, privacy/provenance contract, implementation, tests, and deployment evidence. |
| Production readiness | Not claimed | Future QA, security, deployment, and live-target evidence gates. |

## Explicit non-claims

This repository does not currently claim:

- live or privileged application routes, APIs, or deployed upstream connectivity beyond the optional unprivileged enrollment client;
- live Matrix reading, discovery, joining, authentication, posting, membership, federation, or live rooms;
- Synapse admin/appservice authority or credentials;
- implementation or deployment of Castalia Control, authoritative proof verification/replay consumption, or anchored Dregg authority;
- authenticated sessions, active membership, `dga1_` custody/presentation, application status retrieval, or community/room provisioning;
- AI interpretation, canonical summaries, or an interpreter repository;
- infrastructure, deployment, security approval, or production readiness.
