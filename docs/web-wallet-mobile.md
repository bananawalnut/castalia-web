# Mobile Web wallet boundary

Status: implemented source contract; hosted CI and clean-device acceptance remain required before production enablement.

Castalia Web can act as a first-party wallet on browsers where the Chrome extension is unavailable. It creates the same portable Dregg-hybrid identity as Castalia Wallet: one operating-system-random 32-byte root is used as the Ed25519 seed and as FIPS 204 `xi` for deterministic ML-DSA-65 key generation.

## Custody and storage

Private operations run in a dedicated Web Worker backed by `crates/castalia-wallet-wasm`. The main page never receives the decrypted PKCS#8 container or a generic signing capability. IndexedDB stores:

- the `castalia.wallet-custody.v1` encrypted container;
- the Ed25519 public Member Key;
- the ML-DSA-65 public key and Dregg key commitment;
- whether the member confirmed a recovery method; and
- the verified public Zenith membership credential, if issued.

The encrypted container uses NFC-normalized passphrase input, Argon2id with 64 MiB memory and three iterations, and AES-256-GCM with the canonical header as associated data. The passphrase encrypts the random identity root; it does not derive the identity.

The unlocked root lives only in Worker memory. Hiding the page locks it, navigation destroys the Worker, and a later visit requires the passphrase again. Browser storage is not hardware-backed custody and must not be presented as suitable for high-value authority.

## Recovery

Creation produces a one-time `castalia-recovery-key-v1.<43-character-root>.<6-character-checksum>` string containing the unpadded-base64url random 32-byte root plus a four-byte domain-separated typo checksum. That string is signing authority. The UI reveals it only as part of an explicit recovery ceremony and does not persist it.

The member may also download `.castalia-recovery`, an independently randomized encrypted copy of the same root. Importing either form restores the same Ed25519 public key, ML-DSA-65 public key, and Dregg commitment. `.castaway` remains a different future portable ontology vault.

Membership issuance is disabled until a recovery method is confirmed. Restore operations count as recovery possession, but the member should still create a fresh encrypted export for the current passphrase.

## Membership and non-claims

The Worker's message protocol exposes only the fixed Zenith v3 membership-join signature, which the Rust core constructs from its own public key. It does not accept arbitrary bytes from the page. The page sends the public request to the configured HTTPS issuer, verifies the returned credential against the build-pinned trust policy, binds it to the current public key, and then persists the public credential.

The integrity of Castalia's first-party JavaScript, WASM artifact, dependencies, and deployment is therefore a custody boundary. This browser design cannot protect an unlocked wallet from compromised same-origin application code and must fail closed when its expected artifacts or trust configuration are unavailable.

This creates no login cookie, Castalia session, Matrix token, Control approval, role, capability, or delegation. The browser wallet does not implement `.castaway`, Dregg transaction submission, hardware-backed keys, multi-device synchronization, or silent cloud recovery.

## Public-fixture policy

This public repository intentionally vendors no deterministic private seed, plaintext private-key fixture, or reusable recovery key. Rust tests generate ephemeral identity material during each run. Fixed cross-client custody vectors, if required, belong in a restricted compatibility suite and must never be copied into the public Web branch.
