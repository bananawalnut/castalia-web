# Castalia Control authority boundary

Status: accepted planning contract from issue #9. This document supersedes issue #1's unresolved separate-registry ownership model without claiming that Castalia Control, wallet presentation, provisioning, or anchored authority is implemented.

## Historical supersession

Historical issue #1 correctly established that Castalia Web is unprivileged, Matrix remains canonical for Matrix state, and Hub cannot become community authority merely because it can provision Zenith-hosted resources. It left community identity and lifecycle with an unspecified independently owned registry.

The accepted architecture now resolves that ownership differently: Castalia is the permissioned collective, and Castalia Control is its Dregg authorization and admission-policy service. The old unresolved-registry statement remains provenance, not the active target architecture.

## Authority composition

| Surface | Canonical authority | Boundary |
| --- | --- | --- |
| Castalia authorization decisions | Castalia Control, using Dregg-rooted capabilities | Verifies wallet holder proof plus delegated authority. It owns no browser session or Matrix credential. |
| Challenge and replay policy | Castalia Control | Issues bounded challenges, rejects replay, evaluates expiry/revocation/discharges, and emits redacted receipts. |
| Castalia syndicate admission, member admission policy, and request/status | Castalia Control | Syndicate admission is distinct from Matrix room membership, Matrix account state, and machine authority. |
| Infrastructure execution | The infrastructure provisioner | Holds cloud, DNS, Synapse-admin, signing, federation-admission, and deployment credentials. It executes only separately authorized mutations. |
| Zenith-hosted provisioning | Hub may serve as the infrastructure provisioner | Hub is not Castalia authorization authority and is not the Castalia registry merely because it executes Zenith-hosted changes. |
| Matrix accounts, devices, rooms, membership, events, edits, redactions, access tokens, cross-signing, and E2EE | Matrix | Matrix remains canonical for Matrix state. Native Matrix device and encryption state stays client-side. |
| Web experience | Castalia Web | Remains an unprivileged client with no provisioning secrets, Matrix admin credentials, or cookie/BFF authority session. |

## Planned request boundary

A future Castalia Web client may request a bounded challenge, ask Castalia Wallet to present holder proof plus a wallet-held `dga1_` capability, and call Castalia Control directly. Castalia Control may return a typed decision or plan receipt. Consequential infrastructure execution remains a separate provisioner operation under narrower authority.

Authentication and authorization stay distinct:

- the wallet signature proves control of the wallet key over the exact request context;
- the Dregg capability proves delegated authority;
- Castalia Control verifies both and binds the capability subject to the verified wallet key;
- neither a Matrix login nor browser possession of a token creates Castalia authority.

## Fixture and anchored authority

A fixture issuer proves only local composition. Fixture responses and receipts must identify fixture authority and cannot support a staging, production, or Dregg-rooted claim.

Anchored authority requires a fail-closed verifier that connects the exact `dga1_` issuer key and allowed operation to current Dregg authority evidence or to a discharge from a currently Dregg-authorized gateway. An issuer allowlist or self-signed configuration is not sufficient. Unavailable, stale, expired, revoked, wrong-network, wrong-key, or wrong-tool evidence denies.

No anchored authority implementation or evidence exists in this repository.

## Provisioner separation

The infrastructure provisioner remains necessary because wallet/browser code and Castalia Control policy code must not hold cloud, DNS, Synapse-admin, signing, federation-admission, or deployment credentials. Authorization does not itself perform a mutation. The provisioner must receive a bounded authorized request, enforce its own operation contract, execute the mutation, and return typed evidence.

For Zenith-hosted resources, Hub may remain that executor. Other syndicate operators may run their own provisioners without sharing one Macaroon HMAC root or granting Hub universal authority.

## Matrix separation

Matrix identity, Castalia membership, homeserver operation, Dregg authority, and machine authority are separate concepts. A future Dregg-aware Synapse login may derive an ordinary Matrix access token and device ID after authority verification, but Dregg does not currently replace Matrix credentials for `/sync`, room, device, cross-signing, or E2EE endpoints.

## Current repository claim

Castalia Web currently provides deterministic fixture routes, a fixture BFF, contract sources, visible unavailable states, and a local Rust/WASM validator for the exact shape and context of a future wallet-onboarding request envelope. The validator signs nothing, verifies no wallet presentation, consumes no replay nonce authoritatively, and issues no session. The repository does not currently provide wallet authentication, `dga1_` presentation, Castalia Control connectivity, request submission, admission status, provisioning, Matrix access, deployment, or production readiness.

## Forbidden authority substitutions

The following must never be described as canonical Castalia authorization authority:

- Castalia Web or its browser storage;
- the fixture BFF or a cookie session;
- Hub solely because it holds infrastructure credentials;
- a Matrix account, room, access token, or homeserver;
- a standalone or fixture `dga1_` issuer;
- the extension's legacy locally structured capability-token path;
- a shared `em2_` Macaroon root across independently operated syndicates;
- an unproven `eb2_` compatibility path.

## Evidence gates

This planning contract becomes implementation evidence only through separately reviewed issues and pull requests that prove:

1. exact-request wallet presentation and external holder binding;
2. fail-closed Castalia Control verification and bounded replay/resource controls;
3. canonical wallet custody and direct unprivileged Web integration;
4. fixture composition evidence explicitly marked fixture-only;
5. anchored Dregg authority evidence verified independently;
6. provisioner and Matrix boundaries remain separate.

Until those gates pass, all new behavior remains planned or unavailable.
