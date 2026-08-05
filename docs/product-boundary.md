# Product boundary

Status: accepted planning contract from issue #9, preserving issues #1 and #2 as provenance while superseding issue #1's unresolved separate-registry target. The public Pages site is bounded static-fixture deployment evidence, not live-integration or production evidence.

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

Issue #2 implemented the deterministic fixture shell, fixture BFF, canonical OpenAPI/JSON Schema sources, local UI primitives, and a network-free read-only Matrix interface. The route surfaces below render deterministic fixture or unavailable states. They do not perform Matrix, Castalia Control, wallet-provider/signing, provisioning, authentication, or production network operations. A later local-only Rust/WASM module validates the shape and context of a future wallet-onboarding request envelope; it accepts no credential, contacts no signer, verifies no presentation, and creates no session.

## Canonical routes and navigation

The route inventory is:

- `/`
- `/tenders`
- `/tenders/:tenderId`
- `/rfcs`
- `/rfcs/:rfcId`
- `/docs`

The compact primary navigation contains **Chronicle** (`/chronicle`), **Tenders** (`/tenders`), **RFC** (`/rfcs`), **Merch** (`/merch`), and **Docs** (`/docs`). Tenders, RFC, and Docs are implemented fixture destinations. Chronicle and Merch remain visible placeholders, and the landing **Start** action remains unavailable. The previous standalone Proposals, Spaces, Rooms, Problems, creation, request, API-doc, specification, architecture, and exchange-preview routes resolve to the retained not-found page.

These paths began as the I01 navigation contract and now exist as deterministic fixture surfaces. Their existence is not evidence of live Matrix or Castalia Control integration, authentication, provisioning, deployment, or production readiness.

## Landing visual boundary

The `/` landing route is a decorative fixture shell, not a room list, live world view, or status dashboard. It presents the Castalia title and indented declaration with the checked-in Merlin and Angel bitmap figures, an explicit pixel-star night sky containing an unconnected Aquarius arrangement, and a checked-in image-derived ASCII river.

The night sky, figures, river, and all character substitutions are `aria-hidden`, pointer-inert, and non-authoritative. Their animation changes presentation only: it does not fetch data, persist state, expose credentials, represent a live Dregg world, or imply Matrix, Castalia Control, admission, identity, or deployment status. `prefers-reduced-motion: reduce` leaves the river static. The subtitle remains free of decorative stars at wide and narrow review widths.

Three keyboard-accessible ASCII stepping-stone links—**Spaces**, **RFC**, and **The Commons**—remain at distinct points along the lower river. RFC opens the implemented fixture registry; Spaces and The Commons currently resolve to the retained not-found surface. They perform local client-side navigation only and do not enter a live world, authenticate, join a room, or contact an upstream service.

## Spaces and rooms boundary

Spaces and rooms are not currently routed. Their retained not-found behavior is not evidence of a directory, membership, room access, creation, Matrix operation, or upstream integration. RFC documents and tenders remain independent of Spaces.

## Fixture artifact boards

`/rfcs` is independent from Spaces. It lists RFC documents and each entry links to an exact fixture viewer at `/rfcs/:rfcId`. A proposal is represented as an RFC document with `kind: Proposal`; it uses the RFC identifier, revision, catalog, and viewer rather than a standalone proposal route or `PRP-` identifier.

`/tenders` is a separate read-only registry of contract opportunities. Each entry links to an exact fixture viewer at `/tenders/:tenderId` and preserves the sequence **Tender → Bid → Award decision → Contract**. A bid is an offer to perform the tendered work; it is not an award or contract. The current frontend accepts no bid input and creates no bid, award decision, contract, payment, notification, or credential.

These registries and viewers read checked-in synthetic examples only. They contain no drafting or bidding forms, claim-confirmation workflow, repository reads or writes, publication, WMT execution, assignment, notification, ranking, payment, contract authority, or remote requests.

## Documentation surface

`/docs` is the only routed documentation page. It is a compact, information-first map of retained surfaces, product-model distinctions, and fixture boundaries. The previous large card grid and nested API, specifications, RFC architecture, and exchange-preview pages are no longer routed.

## Project and repository boundary

- `bananawalnut/castalia-web` owns the public fixture web experience and its unprivileged integration contracts.
- It is independent from the Rust/Dregg Castalia repository. Integration is planned only through reviewed public contracts; no code, release, credential, or current implementation claim is shared.
- Matrix remains canonical for accounts, rooms, events, edits, redactions, membership, and participant-authorized sends.
- Castalia Web must remain unprivileged. It receives no Synapse admin or appservice credentials.
- Castalia Control is the planned Dregg authorization, challenge/replay, admission-policy/status, revocation/discharge, and receipt service for the Castalia collective. This repository does not implement or host it.
- The infrastructure provisioner alone holds cloud, DNS, Synapse-admin, signing, federation-admission, and deployment credentials. Hub may fill that execution role for Zenith-hosted resources, but it is not Castalia authorization authority.
- A future Web client may present exact-request wallet proof plus delegated Dregg authority directly to Castalia Control. It must not create a cookie/BFF authority session or persist raw capabilities.
- The current browser/WASM seam validates only an outbound request envelope and returns any future provider presentation as pending remote verification. It is not wallet authentication evidence. See the [Vanilla TypeScript and wallet WASM boundary](vanilla-wasm-wallet-boundary.md).
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
- implement tender publication, bid submission or confidentiality, evaluation, award authority, contract formation, payment, or execution tracking; or
- establish deployment, security approval, or production readiness.
