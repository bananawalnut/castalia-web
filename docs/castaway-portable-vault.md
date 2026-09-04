# Castaway portable-vault boundary

Status: identity-section v1 implemented by Castalia Web; the general multi-object vault remains a versioned design contract

`.castaway` names an application-neutral encrypted vault that can move between Castalia-compatible wallet applications. Its contents are primitives or objects typed through the versioned Zenith Ontology, not proprietary Web records.

The first implemented slice deliberately contains one `identity` section. Castalia Web fails closed on unknown or additional sections because it cannot yet preserve them opaquely. A later general-vault revision must freeze an ontology manifest, entry and relationship encoding, opaque-preservation behavior, authority-installation ceremonies, and cross-implementation vectors before accepting arbitrary sections.

## Identity section v1

The decrypted contents use `castalia.castaway-contents.v1` and contain exactly one `zenith.identity-section.v1` section. The subject defaults to `Person` and is bound to the wallet's 32-byte Ed25519 Member Key.

The current ontology projection supports:

- Person fields: display name, given name, family name, headline, biography, HTTPS website, and ORCID;
- optional Person roles: `Author`, `Researcher`, and `Student`;
- typed affiliations to `AcademicInstitution` objects, with name, department, position or programme, identifier, and HTTPS website; and
- typed relationships to journals, with Author, Editor, Reviewer, or Contributor relationship, identifier, and HTTPS website.

`AcademicInstitution` is an organization affiliation, not a subtype of Person. Roles and relationships are self-asserted metadata. They do not grant Castalia permissions and are not institutional or journal verification.

Every field, role, affiliation, and journal relationship has an independent disclosure state. The default is `private`. Marking a claim `selected` does not transmit it. The only current disclosure ceremony is an explicit download of `zenith.identity-disclosure.v1`, which contains only the selected non-empty claims, identifies them as `self-asserted`, and is plaintext so the member can inspect exactly what they chose to share. Castalia Web performs no automatic upload, synchronization, indexing, or publication.

## Encryption and custody

IndexedDB never stores identity claims in plaintext. While the browser wallet is unlocked, its Rust/WASM custody Worker canonicalizes the identity JSON and seals it as `castalia.castaway-local-section.v1` using AES-256-GCM. The local sealing key is domain-separated from the wallet's random root with BLAKE3 and never crosses the Worker boundary. The local envelope is bound to the Ed25519 Member Key.

Portable export re-encrypts `castalia.castaway-contents.v1` as `castalia.castaway.v1` with a member-chosen, NFC-normalized passphrase:

- Argon2id v1.3, 64 MiB memory, three iterations, one lane, 32-byte output;
- a fresh random 16-byte salt on every export;
- AES-256-GCM with a fresh random 12-byte nonce and a 128-bit tag; and
- the canonical outer header as associated data.

The outer header exposes the format, contents schema, owning public Member Key, export time, and encryption parameters. The identity claims remain ciphertext. Import is capped at 1 MiB, rejects unknown fields and non-canonical encodings, and requires both the vault passphrase and the already-unlocked wallet with the same Member Key.

## Recovery is separate

`.castalia-recovery` is a narrow encrypted copy of the wallet's root signing authority. `.castaway` contains profile data and no signing key. Neither format creates membership, a login session, a role, a capability, or a delegation.

Wallet commits `f7418f4` through the correction at `b38bb31` briefly used the filename `Castaway-<timestamp>.castaway` for a custody-v1 signing-key container. Those historical files are recoverable authority and require a legacy recovery migration; they are not identity-section v1 vaults.

## Product promise and next boundary

Portability means both byte custody and semantic continuity. Compatible applications can present different interfaces while preserving authenticated entries, stable ontology types, typed relationships, provenance, and rights. Data is not automatically authority: importing a private key, credential, bearer capability, or executable object will require a distinct, type-aware installation ceremony.

Homeservers, relays, and multi-device synchronization are future transport concerns. They must not change the privacy rule: storage is not disclosure, selected is not sent, and every transmission needs a visible member action and a bounded projection.

See the public Chronicle draft at `/chronicle` for the broader Web3 argument.
