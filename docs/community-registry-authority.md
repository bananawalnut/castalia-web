# Canonical community registry authority decision

Status: **HOLD — authority unresolved** for a canonical/live registry; an operator-authorized fixture mock may proceed under issue #7. This record does not identify, create, or authorize a registry provider.

## Decision

Castalia Web does not currently have accepted primary evidence naming the canonical community registry's owner, repository or service, authority scope, public-read authorization, version policy, privacy policy, or integrity model. The repository must therefore remain fixture-only and network-free for registry behavior.

No provider schema or live client may be described as canonical until an authorized owner and source ratify the contract. Negative search results are not proof that no registry exists; they are evidence that this repository cannot safely choose one from current material.

## Operator-authorized fixture fallback

After the authority gap was confirmed, the operator authorized a deterministic registry mock derived from synthetic Synapse homeserver user fixtures. This fallback may map an explicitly public fixture user identity into the existing unavailable community descriptor. It must remain offline, credential-free, fixture-only, and non-authoritative.

The fallback does not make Synapse the canonical community registry. A Matrix user account is not inherently a community, and Matrix remains authoritative only for its own account, room, and event domains. The mock mapping is local product test data, not evidence that a real homeserver user exists, that a room exists, or that a user/community relationship is canonical.

## Bounded discovery evidence

Discovery was performed for issue #7 after I03 merged. The following observations are bounded to the inspected sources and their state at that time:

| Source | Observation | Authority consequence |
| --- | --- | --- |
| Castalia Web authority and product documents | They assign community identity, descriptor, and lifecycle status to a separately owned canonical registry but name no owner, repository, service, endpoint, version, key, or public-read policy. | Castalia Web is a prospective consumer, not the registry authority. |
| Castalia Web runtime and contracts | They contain deterministic community/request fixtures and a fixture BFF only. | Fixture shape is not provider evidence and cannot be promoted to a canonical wire contract. |
| ZenithResearch repository inventory | No repository identity or description observed in the inventory establishes community-registry ownership. | Repository naming cannot supply the missing owner decision. |
| ZenithResearch code search | Bounded searches for `canonical community registry`, `community registry`, `community-request`, `request/status-first`, `community lifecycle`, and `community descriptor` returned no authoritative implementation evidence. | Search absence does not prove non-existence; it blocks an unsupported authority claim. |
| Matrix | Matrix remains canonical for accounts, rooms, events, membership, edits, redactions, and participant-authorized sends. | Matrix authority does not by itself define Castalia community identity or lifecycle. |
| Hub | The accepted boundary limits Hub to a privileged adapter for authorized Zenith-hosted provisioning. | Hub is not the canonical community registry and cannot be silently promoted into it. |

## Missing authority evidence

Before the HOLD can clear, an accepted owner must provide or approve evidence for all of the following:

1. owner identity and accountable decision-maker;
2. owner-controlled repository or deployed service identity;
3. authority scope for community identity, descriptor, lifecycle/status, and public Matrix references;
4. contract versioning and compatibility policy;
5. public-read authorization and rate/availability expectations;
6. provenance/integrity mechanism and receiver-held trust anchor, if responses are signed;
7. freshness, revocation/deletion, duplicate identity, ambiguity, and conflict behavior;
8. privacy classification and fields forbidden from public responses;
9. canonical error and unavailable semantics;
10. owner ratification of the consumer contract or an owner-published source from which it is generated.

## Proposed consumer requirements

The following are Castalia Web's minimum fail-closed requirements. They are not an accepted provider contract while authority remains unresolved:

- stable community identifier and public-safe human-readable descriptor;
- explicit lifecycle/status with unavailable and retired behavior;
- optional public Matrix room reference only when owner-authorized and non-secret;
- source identity, contract version, and provenance metadata;
- freshness metadata or immutable-version semantics;
- deterministic ordering and pagination if listing exists;
- duplicate identifiers, conflicting candidates, unknown versions, stale data, invalid provenance, malformed fields, and forbidden fields reject or remain unavailable;
- no mutation, provisioning, authentication, joining, membership, posting, admin, appservice, or credential-bearing operation.

## Privacy and secret boundary

A public read response must never contain Matrix access tokens, Synapse admin/appservice credentials, private membership or contact data, internal moderation material, operator-only infrastructure data, secret-bearing URLs, raw private proofs, or provisioning credentials. Castalia Web must not log or persist such material if a malformed source supplies it.

## Unlock conditions

Task 1 is complete as an authority-gap record. Tasks 2–4 may proceed only for the operator-authorized offline Synapse-user fixture mock, beginning with RED contract tests. A canonical provider contract or live client remains blocked until the user or another accepted authority explicitly identifies the owner/source and owner-controlled evidence is linked here.

## Current claim boundary

The repository may claim that it has documented its registry authority gap, minimum consumer requirements, and authorization for an offline Synapse-user fixture mock. It may not claim that a canonical registry currently exists, is deployed, is reachable, has accepted this contract, or authorizes any live read. Existing and future mock routes remain deterministic and non-authoritative.
