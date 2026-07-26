# Issue #16 exact-head ontology review at cef7e5d

- Delegation batch: `deleg_603a0786`
- Reviewed commit: `cef7e5d9a9aafcdd61154b33a68a164eb64a056d`
- Preservation: Verbatim independent review report

# REQUEST CHANGES

Verified clean exact HEAD `cef7e5d9a9aafcdd61154b33a68a164eb64a056d` on `docs/rfc-world-model-trajectories`.

## Blocking contradictions

1. **O5 — Exchange boundaries**
   - **Sections:** `Paired problem board and RFC exchange model` line 105 and `User experience / Problem board and exchange` line 470 conflict with `ExchangeEntryV1` line 168.
   - The former says an `ExchangeEntry` can “revise” or “endorse” and presents revisions/endorsements as exchange content; the latter prohibits exchanges from recreating candidate revisions or endorsements.
   - **Minimal fix:** State that exchanges may only **discuss or reference** canonical revision/endorsement artifacts. Remove “revise” and “endorse” from the `ExchangeEntry` capability list, or explicitly identify their separate canonical artifact types.

2. **O7 — Lifecycle/attention**
   - **Section:** `Lifecycle and transition authority`, lines 182–201.
   - The claimed “complete transition-authority matrix” is not exhaustive:
     - Problem close/reopen is written as ``open` and `closed`` rather than separate directed transitions.
     - The RFC row collapses the entire lifecycle into “Draft through review/disposition.”
     - Solution-assessment transitions between supported/rejected states are unspecified.
     - Exchange `withdrawn` and `superseded` dispositions lack explicit transition rows.
     - Terminal, reopen, and stale-decision behavior is not enumerated consistently for problems, RFCs, solution claims, and exchanges.
   - **Minimal fix:** Replace the compressed rows with one row per exact `source → target` transition, naming canonical artifact, authority, revision binding, terminal/reopen behavior, and stale-decision handling. Keep request state, disposition, assessment, and attention projections separate.

3. **O10 — Deterministic layout/hashing**
   - **Sections:** `Canonical repository structure` lines 227–301 and `Remaining acceptance decisions` lines 638–644.
   - The design calls the structure and layout manifest normative, while still leaving both canonical JSON/hash algorithms and confirmation of the canonical repository structure unresolved. Therefore path/digest/layout validation is not yet fully deterministic despite the O10 ledger claiming resolution.
   - **Minimal fix:** Select the canonical JSON representation and domain-separated digest algorithms, provide their test-vector requirement, and make the displayed repository structure final—or replace it with one explicit normative structure. Remove these as open design decisions afterward.

## O1–O10 status

- **Resolved without blocking contradiction:** O1, O2, O3, O4, O6, O8, O9.
- **Still blocking:** O5, O7, O10.

No files were created or modified. No repository issues were encountered.
