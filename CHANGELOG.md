# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]

### Added

- Added the shared Zenith membership v3 contract, canonical vector, stateless possession-verifying issuer, and independent Web credential verifier.
- Added the direct Castalia membership flow on `/start` — Web asks Wallet to open a Chrome-owned popup outside page-owned DOM and displays Active status only after cryptographically verifying the exact v3 credential and binding it to the current Wallet Member Key.

### Changed

- Removed member-class selection, Control approval, browser session issuance, and application language from active Join. Zenith is initially the sole compatible signer; Dregg permissionless v2 remains dormant compatibility.

### Fixed

- Membership contract negative tests are valid under both ESLint project service and strict TypeScript, and the onboarding boundary document now satisfies its explicit authority-phrase gate.
- Membership-ready events and compatibility lookups require the exact signed v3 credential, deterministic membership ID, pinned issuer, valid signature, and current Wallet owner with no unrecognized fields.
- Zenith membership verification now passes owned byte buffers to WebCrypto under Node 24, validates untyped transcript and trust-policy inputs, and resolves the workspace contract source in clean hosted builds and browser runs.
