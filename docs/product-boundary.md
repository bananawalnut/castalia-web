# Product boundary

Status: accepted planning contract from issue #9, preserving issues #1 and #2 as provenance while superseding issue #1's unresolved separate-registry target. This remains bounded repository evidence, not live-integration, deployment, or production evidence.

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

Issue #2 implemented the deterministic fixture shell, fixture BFF, canonical OpenAPI/JSON Schema sources, local UI primitives, and a network-free read-only Matrix interface. The route surfaces below render deterministic fixture or unavailable states. They do not perform Matrix, Castalia Control, wallet, provisioning, authentication, or production network operations.

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
- `/docs/rfc-exchange/preview`

The fixture implementation of every route provides keyboard-accessible navigation to Communities (`/`), the selected forum (`/community/:slug/forum` when one is selected), Create community (`/create`), and Docs (`/docs`), plus an explicit unavailable session state. An unavailable or blocked destination remains visible and clearly labelled unavailable; it does not imply that the upstream capability works.

These paths began as the I01 navigation contract and now exist as deterministic fixture surfaces. Their existence is not evidence of live Matrix or Castalia Control integration, authentication, provisioning, deployment, or production readiness.

## Project and repository boundary

- `ZenithResearch/castalia-web` owns the future web experience and its public, unprivileged integration contracts.
- It is independent from the Rust/Dregg Castalia repository. Integration is planned only through reviewed public contracts; no code, release, credential, or current implementation claim is shared.
- Matrix remains canonical for accounts, rooms, events, edits, redactions, membership, and participant-authorized sends.
- Castalia Web must remain unprivileged. It receives no Synapse admin or appservice credentials.
- Castalia Control is the planned Dregg authorization, challenge/replay, admission-policy/status, revocation/discharge, and receipt service for the Castalia collective. This repository does not implement or host it.
- The infrastructure provisioner alone holds cloud, DNS, Synapse-admin, signing, federation-admission, and deployment credentials. Hub may fill that execution role for Zenith-hosted resources, but it is not Castalia authorization authority.
- A future Web client may present exact-request wallet proof plus delegated Dregg authority directly to Castalia Control. It must not create a cookie/BFF authority session or persist raw capabilities.
- See the [Castalia Control authority boundary](castalia-control-authority.md) for fixture-versus-anchored authority and execution separation.

## Historical issue #1 non-goals

Issue #1 did not:

- scaffold or implement the application;
- provide Matrix room reading, joining, posting, membership, or federation;
- provision communities, infrastructure, accounts, or rooms;
- add Matrix credentials or assume live rooms;
- implement AI interpretation or create an interpreter repository;
- define a universal ontology; or
- establish deployment or production readiness.

Those constraints remain historical provenance. Issue #2 later implemented only the fixture surfaces described above; it did not make the deferred capabilities live.

## Current issue #9 and repository non-goals

Issue #9 changes documentation and semantic claim checks only. It does not:

- implement wallet proof, `dga1_` custody or presentation, Castalia Control, anchored Dregg authority, or provisioner execution;
- provide Matrix reading, joining, posting, membership, federation, login, access-token, cross-signing, or E2EE behavior;
- provision communities, infrastructure, accounts, rooms, or syndicate admission;
- add infrastructure, Synapse-admin, appservice, signing, federation-admission, or deployment credentials;
- create a cookie/BFF authorization rail or move authorization into Castalia Web; or
- establish deployment, security approval, or production readiness.
