# Mobile Web wallet boundary

Status: implemented source contract; hosted CI and clean-device acceptance remain required before production enablement.

Castalia Web can act as a first-party wallet on browsers where the Chrome extension is unavailable. It creates the same portable Dregg-hybrid identity as Castalia Wallet: one operating-system-random 32-byte root is used as the Ed25519 seed and as FIPS 204 `xi` for deterministic ML-DSA-65 key generation.

## Custody and storage

Private operations run in a dedicated Web Worker backed by `crates/castalia-wallet-wasm`. The main page never receives the decrypted PKCS#8 container or a generic signing capability. IndexedDB stores:

- the `castalia.wallet-custody.v1` encrypted container;
- the Ed25519 public Member Key;
- the ML-DSA-65 public key and Dregg key commitment;
- whether the member confirmed a recovery method; and
- the verified public Zenith membership credential, if issued; and
- a root-key-sealed `.castaway` identity section whose claims are never stored in plaintext.

The encrypted container uses NFC-normalized passphrase input, Argon2id with 64 MiB memory and three iterations, and AES-256-GCM with the canonical header as associated data. The passphrase encrypts the random identity root; it does not derive the identity.

The unlocked root lives only in Worker memory. Same-origin in-app navigation retains the unlocked Worker so a member can move from Join to Profile; hiding the page locks it, and a later visit requires the passphrase again. Browser storage is not hardware-backed custody and must not be presented as suitable for high-value authority.

## Recovery

Creation produces a one-time `castalia-recovery-key-v1.<43-character-root>.<6-character-checksum>` string containing the unpadded-base64url random 32-byte root plus a four-byte domain-separated typo checksum. That string is signing authority. The UI reveals it only as part of an explicit recovery ceremony and does not persist it.

The member may also download `.castalia-recovery`, an independently randomized encrypted copy of the same root. Importing either form restores the same Ed25519 public key, ML-DSA-65 public key, and Dregg commitment. It does not restore profile claims; those travel in the separately encrypted `.castaway` identity vault.

## Private profile and Castaway

An Active browser-wallet member can open `/profile`. The profile defaults to the Zenith Ontology `Person` type, with optional Author, Researcher, and Student roles plus structured academic-institution and journal relationships. Academic Institution is modeled as an organization affiliation, not as a kind of Person.

The Rust/WASM Worker seals the validated identity section with a root-derived, domain-separated AES-256-GCM key before IndexedDB persistence. Portable `.castaway` export uses an independent member-chosen passphrase, Argon2id, and fresh encryption randomness. Import requires an unlocked wallet with the same Member Key and rejects unknown sections rather than losing data.

All claims default to private. A per-claim checkbox only selects data for a later disclosure ceremony; it does not publish anything. The current ceremony downloads a plaintext, self-asserted JSON projection containing only selected claims. No profile claim is automatically sent to Castalia, Zenith, a journal, an institution, a homeserver, or a relay.

Membership issuance is disabled until a recovery method is confirmed. Restore operations count as recovery possession, but the member should still create a fresh encrypted export for the current passphrase.

## Membership and non-claims

The Worker's message protocol exposes only the fixed Zenith v3 membership-join signature, which the Rust core constructs from its own public key. It does not accept arbitrary bytes from the page. The page sends the public request to the configured HTTPS issuer, verifies the returned credential against the build-pinned trust policy, binds it to the current public key, and then persists the public credential.

The integrity of Castalia's first-party JavaScript, WASM artifact, dependencies, and deployment is therefore a custody boundary. This browser design cannot protect an unlocked wallet from compromised same-origin application code and must fail closed when its expected artifacts or trust configuration are unavailable.

This creates no login cookie, Castalia server session, Matrix token, Control approval, capability, or delegation. Profile roles are descriptive, self-asserted ontology claims—not authorization. The browser wallet does not implement arbitrary Castaway objects, Dregg transaction submission, hardware-backed keys, multi-device synchronization, homeserver or relay transport, or silent cloud recovery.

## Public-fixture policy

This public repository intentionally vendors no deterministic private seed, plaintext private-key fixture, or reusable recovery key. Rust tests generate ephemeral identity material during each run. Fixed cross-client custody vectors, if required, belong in a restricted compatibility suite and must never be copied into the public Web branch.
