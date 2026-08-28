# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased]

### Added

- Added the direct permissionless Castalia membership flow on `/start` — Castalia Web opens the extension-owned Wallet ceremony and displays Active status only after the Wallet returns a verified v2 membership.

### Changed

- Removed member-class selection, Control approval, browser session issuance, and application language from the active Join path — membership is issued directly by Wallet through Dregg.

### Fixed

- Membership-ready events and compatibility lookups now require the exact canonical public v2 summary with no unrecognized fields — malformed or legacy responses cannot be displayed as Active membership.
