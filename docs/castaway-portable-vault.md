# Castaway portable-vault boundary

Status: accepted product meaning; wire format remains a draft in Castalia Wallet

`.castaway` names an application-neutral encrypted vault that can move between Castalia-compatible wallet applications. Its entries are primitives or objects typed through the versioned Zenith Ontology, not proprietary Web records.

The canonical design contract is maintained by Castalia Wallet in `docs/castaway-portable-vault.md`. Before a stable release it must freeze a distinct outer format identifier, encryption profile, ontology manifest, entry and relationship encoding, resource bounds, opaque-preservation behavior, authority-installation ceremonies, and cross-implementation vectors.

## Web boundary

Castalia Web may explain the format and request individually approved public projections from a compatible Wallet. It must not:

- receive or decrypt a `.castaway` vault;
- treat possession of a vault as Castalia membership or sign-in;
- install keys, capabilities, credentials, or executable material;
- infer ontology meaning from UI labels;
- request the entire vault when one bounded object projection is sufficient; or
- claim that the draft wire format is implemented.

The implemented `.castalia-recovery` file is different. It is a narrow encrypted copy of Castalia Wallet's root signing authority. Wallet commits `f7418f4` through the correction at `b38bb31` briefly used the filename `Castaway-<timestamp>.castaway` for that custody-v1 container. Those historical files are recoverable authority and require a legacy recovery migration; they are not examples of the future portable vault.

## Product promise

Portability means both byte custody and semantic continuity. Compatible applications can present different interfaces while preserving authenticated entries, stable ontology types, typed relationships, provenance, and rights. Unsupported entries are preserved opaquely or the import fails visibly; they are never silently discarded or executed.

See the public Chronicle draft at `/chronicle` for the broader Web3 argument.
