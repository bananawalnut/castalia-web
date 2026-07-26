# Issue #16 focused ontology review

- Delegation batch: `deleg_2d387995`
- Verdict: Request changes
- Preservation: Verbatim independent review report
- Status: Resolution paused at checkpoint; findings remain authoritative inputs to the feature design
- Naming note: the reviewed development artifact was then mislabeled “RFC 0001”; it is now the Issue #16 feature design. The report below is preserved verbatim.

# REQUEST CHANGES

1. **Canonical ownership is contradictory** (`RFC:178–230`). A solution claim cannot “appear under both” `problems/.../solution-claims/` and its RFC while remaining one canonical artifact; exchanges and decisions likewise have ambiguous ownership when targeting multiple entities.  
   **Correction:** store canonical graph entities once at repository roots, e.g. `solution-claims/<id>.json`, `exchanges/<id>.json`, and `decisions/<id>.json`. Derive problem/RFC backlinks during validation or use schema-validated reference stubs containing only canonical path and digest. Never check in two full copies.

2. **Immutable revisions contain mutable projections** (`109–125`, `127–151`). Problem/RFC metadata includes lifecycle status and ever-growing exchange, decision, review, and solution-claim backreferences. Every response would therefore create a new problem/RFC revision and stale all existing links.  
   **Correction:** immutable content revisions contain only authored content and forward semantic references. Move lifecycle, backreferences, attention state, and resolution into append-only decision/event artifacts and generated indexes. Define revision identity as `(repository, commit SHA, canonical path, content digest)` and explicitly exclude self-digest fields from canonicalization.

3. **`ProblemSolutionClaimV1` is not itself revision-safe** (`127–140`). It has a stable ID but no claim revision or digest, while its status and reference arrays mutate. It binds the RFC digest but not the problem digest.  
   **Correction:** add `solution_claim_revision`, `solution_claim_digest`, and `problem_digest`; make each claim revision immutable and link revisions with `supersedes`. Derive support status from authorized decision records rather than storing mutable status on the claim revision.

4. **Solution semantics mix orthogonal concepts** (`134–140`). `full|partial` describes coverage, while `prerequisite|mitigation|experiment|counterproposal` describes intervention role. A single `scope` enum creates invalid and lossy claims.  
   **Correction:** split into `coverage: full|partial` and `approach_role: direct_solution|prerequisite|mitigation|experiment|counterproposal`. Bind `criteria_addressed` and `criteria_not_addressed` to stable criterion IDs in the exact problem revision. Define which decision type may derive each support state.

5. **Exchange boundaries duplicate canonical entities** (`142–151`). `solution_claim`, `candidate_revision`, `endorsement`, and `withdrawal` can duplicate `ProblemSolutionClaim`, RFC revisions, reviews, resolutions, and decisions. Mutable `status`, `resolution`, and `preserved_dissent` also conflict with append-only exchange entries.  
   **Correction:** make an exchange a message only. It may reference—but not recreate—a solution claim, candidate revision, review, resolution, or decision. Represent withdrawal, endorsement, resolution, and status changes as typed append-only events or dedicated canonical artifacts.

6. **Threading is underconstrained** (`148–157`). Plural targets plus `responds_to` and `supersedes` do not define a thread root, parent cardinality, cross-thread replies, cycle prevention, or supersession behavior.  
   **Correction:** require `thread_id`, immutable `root_subject_ref`, and zero-or-one `parent_exchange_ref`; require parent and child to share the thread root. Define `supersedes` as an acyclic same-author correction edge that does not remove the superseded entry. Validate all references and cycles repository-wide.

7. **Lifecycle states conflate disposition with derived activity** (`121`, `140`, `523–527`). `under_investigation`, `candidate_solutions`, and `contested` are attention/read-model states, while `closed`, `withdrawn`, `superseded`, and `solved_under_criteria` are dispositions. No complete transition table, terminal-state rules, reopening rules, or stale-decision behavior exists.  
   **Correction:** define separate `disposition` and derived `attention_state` vocabularies. Publish an exhaustive transition matrix naming allowed source/target states, required decision type and authority, terminal/reopen semantics, and the exact revision affected. Apply the same model consistently to RFCs, problems, and solution claims.

8. **Human/agent attribution can falsely imply delegation** (`146–153`). A declared `acting-for` reference is insufficient to say an agent “binds” a principal. `human|agent` also fails to distinguish a human author using model assistance from an autonomous agent submission, and Git authorship is conflated with semantic authorship.  
   **Correction:** model `content_authors`, `submitter`, `committer`, `signer`, `automation`, and optional `represented_principal` separately. Representation requires immutable authorization evidence and scope; absent that, label it “agent claim of representation—not verified.” Record invitees/mentions separately from actors and standing.

9. **The inaccessible X exchange cannot be represented without invention** (`144–150`, `558`). `ExchangeEntryV1` requires prose and a semantic `kind`, but the canonical post’s text was unavailable. The URL alone does not justify classifying or paraphrasing it.  
   **Correction:** add an external-source envelope or `ExternalExchangeSourceV1` with `canonical_url`, platform/source ID, retrieval attempts, `content_status: unavailable|partial|verified`, optional captured bytes/digest, and semantic classification status. Permit a source-only unresolved record when content is unavailable; prohibit assigning body, author intent, or exchange kind until verified. Keep the accessible problem-board quotation as a separate fixture with its own provenance.

10. **Problem relations, routes, and layout are not deterministically validatable** (`117`, `165–230`). `parent/narrower/broader`, `related`, and `superseded` duplicate inverse facts without canonical direction or cycle rules. Routes select IDs but not immutable revisions. Path grammar, filenames, reference syntax, uniqueness scope, allowed extras, symlinks, canonical JSON, and generated-versus-authored files remain undefined.  
    **Correction:** define one canonical direction per relation and derive inverses; bind relation endpoints to exact revisions and specify acyclicity/cardinality rules. Add revision-addressed canonical routes such as `/problems/:id/revisions/:revision` and `/rfcs/:id/revisions/:revision`. Publish a repository-layout manifest with exact path regexes, ID normalization, filename rules, schema-to-path mapping, no-symlink/no-unknown-file policy, referential-integrity checks, canonical-byte/hash rules, and valid/invalid fixtures.

**Review scope:** uncommitted RFC correction at repository HEAD `3a75a03b63ce44dc65c22b52ace7d5f55018a76e`.  
**Files modified:** none; review only.  
**Issue encountered:** the canonical RFC-exchange post text remains inaccessible, so no content or semantics were inferred from it.
