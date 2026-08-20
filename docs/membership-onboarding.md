# Membership onboarding boundary

Status: permissionless base-membership Join and membership issuance are implemented across Castalia Web, Castalia Wallet, and the Dregg node contract. It creates no Castalia sign-in session and grants no role, service, infrastructure, or Matrix authority.

## Active Join sequence

`/start` performs this sequence when a compatible Wallet extension is installed. Compatibility is explicit: the provider must advertise `membershipJoinProtocol: "castalia.permissionless-membership.v2"`. A provider without that marker is the retired non-issuing build, so Web displays **Wallet update required** and does not open its Join UI.

1. The member selects **Join Castalia**. There is no individual/institution selector and no application or review state.
2. Web opens extension-owned UI. Web never receives private key material and never constructs membership coordinates.
3. Wallet creates or unlocks its encrypted durable Ed25519 Member Key.
4. Wallet signs `castalia/permissionless-membership-join/v2\0 || ownerPublicKey` and sends the public key plus signature directly to `POST /api/castalia/memberships` on the configured Dregg node.
5. Dregg verifies possession, derives the one-per-key cell identifier, and creates the exact public v2 factory cell directly in immutable Active state. A retry returns the existing exact cell.
6. Wallet reads `GET /api/cell/{cellId}` and independently verifies deterministic addressing, Member Key ownership, token domain, all sixteen state fields, immutable Cases program, zero capabilities/delegation, and the issued state commitment.
7. Wallet persists only the public verified binding and approves the exact embedding origin for the current browser session.
8. Only then does Wallet signal readiness with the exact public Active generation-zero summary it just verified. Web validates that bounded handoff before reporting success. For compatibility, a ready event from an older Wallet with no summary triggers one `getMembership()` read instead.

An unsolicited or duplicate Wallet-ready event cannot start or repeat Join. A malformed summary fails closed. Network, signature, schema, owner, address, state, program, capability, or commitment failure stops the flow and Web does not claim membership. If Wallet reports completion but the compatibility read fails, Web shows that exact confirmation error and warns that the deterministic membership may already exist; it does not falsely claim that nothing was issued.

## Authority and verification

Base Castalia membership is permissionless. Control is not an admission authority in this path. The Member Key signature proves consent and possession; the Dregg factory enforces the complete birth shape; the deterministic cell provides the public membership record.

The v2 base membership is intentionally immutable and non-revocable. Moderation, service access, sanctions, institutional roles, infrastructure operations, Matrix sessions, and other consequential authority must live in separate capability or role cells. Those narrower operations may use Castalia Control or another authorized coordinator without making Control a prerequisite for base membership.

Wallet verification currently reads a configured Dregg node over HTTPS, with loopback HTTP allowed for local acceptance. It verifies the returned canonical cell shape but does not yet carry a light-client inclusion proof to a quorum-pinned root. Production deployment evidence therefore requires a Castalia-operated node endpoint and a separately reviewed trust-anchor or light-client step.

No part of Join issues a browser login cookie, Castalia Web session, Matrix access token, Matrix device, or infrastructure credential. Membership and sign-in remain separate work.

## Contract versions and compatibility

The active contract is permissionless membership v2:

- join transcript domain `castalia/permissionless-membership-join/v2\0`;
- request `{ version: 2, ownerPublicKey, signatureSuite: "Ed25519", signature }`;
- public endpoint `POST /api/castalia/memberships`;
- membership schema magic `CASTMEM2`, schema `2`, public policy marker `1`, Active status `1`, generation `0`;
- deterministic cell token domain `BLAKE3("castalia/permissionless-membership-cell/v2\\0")`;
- all sixteen state fields immutable, with no capabilities or delegation.

The former authority-owned `CASTMEM1` application/lifecycle contract, Control challenge client, presentation verifier, and associated helpers remain in their repositories only as compatibility code. They are not called by `/start`. Removal should happen only after downstream consumers no longer import them.

Any producer change to domains, encodings, field order, literal values, deterministic addressing, program shape, or response fields requires synchronized Dregg, Wallet, Web, vector, negative-test, and documentation updates.

The canonical producer vector is mirrored at
`docs/vectors/castalia-permissionless-membership-v2.vector.json`. Its adjacent
SHA-256 file pins the exact bytes, and each repository's tests must reject a
vector or checksum mismatch.

Both the provider marker and Wallet-ready summary are additive fields. New Wallet plus old Web remains compatible because old Web ignores them and uses `getMembership()`. New Web intentionally refuses a pre-v2 Wallet without the marker because that build cannot issue permissionless membership. The no-detail `getMembership()` fallback remains for an already v2-compatible provider whose ready event omits the summary.

## Local acceptance

Run a funded local Dregg node on `http://127.0.0.1:8420`, load the built unpacked Wallet extension, and open the local Web `/start` route. A successful first Join creates the membership; a second Join is idempotent and resolves the same cell.

Focused repository gates:

```text
# Dregg
cargo test -p starbridge-castalia-membership --test permissionless
cargo test -p dregg-node castalia_membership::tests --lib

# Wallet
npm run typecheck --workspace @castalia-wallet/chrome-extension
npm test --workspace @castalia-wallet/dregg-adapter

# Web
pnpm --filter @castalia/web typecheck
pnpm --filter @castalia/web test
pnpm --filter @castalia/web build
```
