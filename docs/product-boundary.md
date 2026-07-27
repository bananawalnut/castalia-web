# Product boundary

Status: accepted planning contract from issue #1, reconciled with the fixture implementation merged by issue #2. This remains bounded repository evidence, not live-integration, deployment, or production evidence.

## Product states

| State | Meaning |
| --- | --- |
| Documentation-only | Historical I01 state before the application scaffold merged. Retained as provenance, not as the current repository state. |
| Fixture implementation | The current repository state. A deterministic fixture shell, fixture BFF, canonical contracts, and unavailable route surfaces are implemented without live upstream access. |
| Visible unavailable | A route may be visibly represented while clearly saying it cannot currently be used. It must not expose data or imply access. |
| Planned | An issue may own future work, but the capability does not exist until its evidence gate passes. |
| Evidence-backed | Reserved for a later capability whose owning issue, tests, review, and deployment evidence all pass. Nothing in this issue reaches this state. |

Under current evidence, the Zenith forum posture remains **visible unavailable**. The fixture page exists, but it is not claimed to be live, readable, joinable, authenticated, or writable.

## Current fixture implementation

Issue #2 implemented the deterministic fixture shell, fixture BFF, canonical OpenAPI/JSON Schema sources, local UI primitives, and a network-free read-only Matrix interface. The route surfaces below render deterministic fixture or unavailable states. They do not perform Matrix, registry, provisioning, authentication, or production network operations.

## Canonical routes and navigation

The route inventory is:

- `/`
- `/community/:slug/forum`
- `/create`
- `/create/:requestId`
- `/docs`
- `/docs/api`
- `/docs/specs`
- `/docs/architecture/rfc-exchange`

The fixture implementation of every route provides keyboard-accessible navigation to Communities (`/`), the selected forum (`/community/:slug/forum` when one is selected), Create community (`/create`), and Docs (`/docs`), plus an explicit unavailable session state. An unavailable or blocked destination remains visible and clearly labelled unavailable; it does not imply that the upstream capability works.

These paths began as the I01 navigation contract and now exist as deterministic fixture surfaces. Their existence is not evidence of live Matrix or registry integration, authentication, provisioning, deployment, or production readiness.

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
