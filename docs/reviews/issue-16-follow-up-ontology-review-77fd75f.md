# Issue #16 follow-up ontology review at 77fd75f

- Delegation batch: `deleg_25180eab`
- Reviewed commit: `77fd75f94a530ddfc69ce62560c8514841b5455f`
- Verdict: `REQUEST CHANGES`

## Remaining blocker — O7 lifecycle remains contradictory and not fully deterministic

- The design defined `tombstoned` as an exchange disposition but later defined it as a terminal moderation overlay, with no transition to that disposition.
- Several rows retained “terminal except tombstone,” preserving the ambiguity.
- “Canonical repository order” was not defined, while request state depended on the latest valid event sequence, leaving concurrent valid events unordered.

Required correction: remove `tombstoned` from the exchange-disposition domain, define it consistently as a separate overlay, remove ambiguous terminal wording, and define an exact total ordering or fail-closed concurrency rule for accepted events.

O5 and O10 passed. No O1–O6/O8–O10 regression was found. The reviewer independently recomputed the canonicalization test digest successfully.
