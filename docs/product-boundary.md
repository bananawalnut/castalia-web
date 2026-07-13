# Product boundary

Status: accepted planning contract for issue #1. This is not implementation or production evidence.

## Product states

| State | Meaning |
| --- | --- |
| Documentation-only | The current repository state. Contracts and non-claims are recorded; no application is scaffolded. |
| Visible unavailable | A route may be visibly represented while clearly saying it cannot currently be used. It must not expose data or imply access. |
| Planned | An issue may own future work, but the capability does not exist until its evidence gate passes. |
| Evidence-backed | Reserved for a later capability whose owning issue, tests, review, and deployment evidence all pass. Nothing in this issue reaches this state. |

Under current evidence, the Zenith forum posture is **visible unavailable**. It is not claimed to be readable, joinable, authenticated, or writable.

## Canonical routes and navigation

The route inventory is:

- `/`
- `/community/:slug/forum`
- `/create`
- `/create/:requestId`
- `/docs`
- `/docs/api`
- `/docs/specs`

Future implementations of every route must provide keyboard-accessible navigation to Communities (`/`), the selected forum (`/community/:slug/forum` when one is selected), Create community (`/create`), and Docs (`/docs`), plus an explicit session state. An unavailable or blocked destination must remain visible and clearly labelled unavailable; it must not imply that the capability works.

These paths are a navigation contract, not evidence that routes or UI exist.

## Project and repository boundary

- `ZenithResearch/castalia-web` owns the future web experience and its public, unprivileged integration contracts.
- It is independent from the Rust/Dregg Castalia repository. No code, release, or authority is implied to be shared.
- Matrix remains canonical for accounts, rooms, events, edits, redactions, membership, and participant-authorized sends.
- Castalia Web must remain unprivileged. It receives no Synapse admin or appservice credentials.
- Hub owns only the privileged adapter for provisioning Zenith-hosted Matrix resources. It does not own the canonical community registry.
- The canonical community registry is separately owned; this repository may consume an authorized contract later but does not define or provision that authority here.

## Explicit non-goals for this boundary

Issue #1 does not:

- scaffold or implement the application;
- provide Matrix room reading, joining, posting, membership, or federation;
- provision communities, infrastructure, accounts, or rooms;
- add Matrix credentials or assume live rooms;
- implement AI interpretation or create an interpreter repository;
- define a universal ontology; or
- establish deployment or production readiness.
