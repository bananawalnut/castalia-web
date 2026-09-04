# Membership onboarding boundary

Status: Zenith-signed base-membership v3 is the active Join contract. It creates no Castalia sign-in session and grants no role, service, infrastructure, Control, or Matrix authority.

## Active Join sequence

`/start` accepts a compatible Wallet only when it advertises `membershipJoinProtocol: "castalia.zenith-membership.v3"`. Older Wallet builds receive **Wallet update required** and their Join UI is not opened.

1. The member selects either **Join with extension** or **Use this browser**. There is no individual/institution selector, application, review, approval, or Pending state.
2. On the extension path, the member's active user action asks Wallet to open a Chrome-owned popup outside page-owned DOM; automatic page calls are rejected. The popup names the requesting Web origin and binds any later approval to that same initiating tab and origin. Extension integration never gives Web a passphrase, private key, `.castalia-recovery` file, `.castaway` vault, private vault entry, or generic signing interface.
3. Wallet creates or unlocks its encrypted durable Ed25519 Member Key.
4. Wallet signs `castalia/zenith-membership-join/v3\0 || ownerPublicKey` and sends only the public key and signature to `POST /v3/memberships` on its compiled Zenith issuer origin.
5. Zenith verifies possession and signs the deterministic Active credential. A retry returns the same credential bytes and creates no session or database record.
6. Wallet verifies the exact credential, owner, issuer-independent membership ID, pinned issuer root, and Ed25519 issuer signature, then persists that public credential.
7. Wallet emits `castalia:wallet:membership-flow-ready` with the full public credential. If an already-v3 Wallet emits no detail, Web reads `getMembership()` once.
8. Web independently repeats strict schema, deterministic-ID, trust-root, and issuer-signature verification before displaying **Membership active**.

On mobile, **Use this browser** creates the same hybrid identity inside a dedicated Web Worker, encrypts its root with Argon2id and AES-256-GCM, and stores only the encrypted custody container plus public bindings in IndexedDB. The member must save and confirm a recovery method before the browser wallet can contact the issuer. The passphrase is an encryption key input; it is not the identity seed. See [Mobile Web wallet](web-wallet-mobile.md).

Unsolicited or duplicate readiness events cannot start or repeat Join. Unknown fields, wrong owners, altered membership IDs, fixture or untrusted issuers, and invalid signatures fail closed. If Wallet reports completion but Web verification fails, Web warns that retry is safe; it never claims an unverified membership.

## Exact public contract

Request:

```json
{
  "schema": "castalia.zenith-membership-issuance-request.v3",
  "version": 3,
  "ownerPublicKey": "<32-byte lowercase hex>",
  "signatureSuite": "Ed25519",
  "signature": "<64-byte unpadded base64url>"
}
```

Membership ID:

```text
SHA-256("castalia/zenith-membership-id/v3\0" || ownerPublicKey)
```

Credential fields are exactly:

```text
schema = castalia.zenith-membership-credential.v3
version = 3
membershipId
ownerPublicKey
status = active
issuerId
issuerKeyId
signatureSuite = Ed25519
issuerSignature
```

The issuer-signature transcript is domain-separated and length-frames every textual identifier. The canonical producer vector is `docs/vectors/castalia-zenith-membership-v3.vector.json`; its adjacent SHA-256 sidecar pins the exact file bytes. The checked-in RFC 8032 key is test-only, and production Web builds require an explicit non-fixture trust configuration.

## Authority and trust

Anyone may become a base member, but Zenith is initially the sole credential signer. That makes issuance operationally centralized while keeping the contract portable: membership IDs do not include the issuer, and Wallet/Web consume a versioned array of trust roots. A future reviewed build can overlap rotation keys or add another compatible issuer without replacing Member Keys.

Zenith alone performs membership issuance. Web requests the Wallet ceremony and verifies its result, but remains an unprivileged relying party.

The issuer private key is never present in Web, Wallet, repository fixtures, or the public credential. A compromised issuer could mint credentials for arbitrary public keys, so key custody and rotation are production security boundaries. It cannot recover a member's private key.

No part of Join issues a browser cookie, Castalia session, Matrix token/device, capability, delegation, role, or infrastructure credential. Membership and sign-in remain separate work.

The planned `.castaway` portable vault is also separate from Join. Possessing or importing a vault does not create membership, and Web cannot ask Wallet to disclose the whole vault when one approved public membership projection is sufficient. See the [Castaway portable-vault boundary](castaway-portable-vault.md).

## Version compatibility

- v3 is active: Zenith-signed deterministic public credential.
- Dregg permissionless v2 remains preserved and tested as a dormant future decentralized path.
- `CASTMEM1`, Control challenge/application helpers, and enrollment presentations remain legacy v1 compatibility.

No v1 or v2 object is silently decoded as v3. The active contract has a new provider marker, schemas, domains, storage key, vector, and verification path. New Web intentionally refuses a pre-v3 Wallet.

## Verification gates

Hosted CI must pass:

```text
pnpm --filter @castalia/membership-contract test
pnpm --filter @castalia/membership-issuer test
pnpm --filter @castalia/web typecheck
pnpm --filter @castalia/web test
pnpm --filter @castalia/web build
pnpm browser:a11y
```

Owner acceptance additionally requires a production issuer key, HTTPS issuer deployment, production-pinned Wallet/Web builds, clean-profile create/export/join/reload/lock/unlock/retry/import coverage, and proof that no cookie or session was created.
