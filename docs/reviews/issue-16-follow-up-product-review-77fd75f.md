# Issue #16 follow-up product review at 77fd75f

- Delegation batch: `deleg_25180eab`
- Reviewed commit: `77fd75f94a530ddfc69ce62560c8514841b5455f`
- Verdict: `REQUEST CHANGES`

## Remaining blockers

- Open requests had no requested actor while answer authority was restricted to a requested actor or delegate, so valid answer authority was undefined.
- Gate 2 fixtures omitted withdrawal, separate immutable lifecycle-event artifacts, hostile conflict/stale/unauthorized/supersession/idempotency cases, and deterministic post-acceptance projections from both problem and actor-oriented views.

The single-recipient directed-request model, answer references, terminal/conflict rules, and paired Problem Board/RFC solution-claim requirements otherwise passed.
