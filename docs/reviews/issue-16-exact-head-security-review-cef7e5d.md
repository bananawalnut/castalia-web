# Issue #16 exact-head security review at cef7e5d

- Delegation batch: `deleg_603a0786`
- Reviewed commit: `cef7e5d9a9aafcdd61154b33a68a164eb64a056d`
- Preservation: Verbatim independent review report

# REQUEST CHANGES

Reviewed exact clean HEAD `cef7e5d9a9aafcdd61154b33a68a164eb64a056d`.

## Blocking finding

**S7 — High: content-safety policy remains incomplete.**

The resolution ledger claims S7 is design-resolved, but the design does not normatively address two categories required by the preserved security review:

- `docs/issue-16-rfc-feature-design.md:507–511` blocks secrets, private material, doxxing, unsupported sensitivity classes, personal data, remote embeds, and unsafe links, and mentions generic quarantine/moderation.
- It does **not** explicitly prohibit or define handling for **harassment** or **illegal/unlawful content**.
- Because `ExchangeEntryV1` permits arbitrary prose and Gate 2 can export it, `classification: public`, an “unreviewed” label, and recommendation exclusion do not prevent harmful material from entering a downloadable PR bundle.

### Exact minimal fix

In the Gate 2 privacy/security requirements:

1. Require a repository-owned content policy to classify **harassment and illegal/unlawful content** as prohibited.
2. Require Gate 2 to reject prohibited content before render/export, or fail closed into a non-exportable quarantine state when adjudication is required.
3. Add hostile fixtures verifying those outcomes.
4. Keep the existing moderation authority, reason-code, appeal, and audit requirements.

Then change the S7 ledger row from “Design-resolved” only after that normative text is present.

## S1–S10 disposition

| Area | Result |
|---|---|
| S1 delegation/impersonation | Pass |
| S2 invitations/harassment routing | Pass for Gate 2: inert references, no mentions or notifications |
| S3 spam/Sybil | Pass |
| S4 lifecycle authority | Pass |
| S5 replay/stale graph handling | Pass |
| S6 cross-repository references | Pass |
| **S7 content safety/moderation** | **High unresolved — blocking** |
| S8 redaction/purge | Pass |
| S9 route mutation overclaims | Pass; Gate 2 remains local draft/validate/preview/download with `405 Unavailable` mutation surfaces |
| S10 X-source provenance | Pass |

- **Files modified:** None.
- **Issues encountered:** None; target worktree was clean and exactly at the requested commit.
