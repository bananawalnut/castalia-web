#!/bin/sh
set -eu

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

required='README.md docs/product-boundary.md docs/authority-and-claims.md docs/repository-evidence.md docs/verification.md docs/issue-16-rfc-feature-design.md docs/issue-16-rfc-feature-review.md docs/architecture/rfc-exchange.md'
for file in $required; do
  test -f "$file" || fail "missing required file: $file"
done

for phrase in 'C4 system context' 'C4 containers and components' 'Artifact graph and ownership' 'Problem publication and view sequence' 'RFC and solution-claim sequence' 'Exchange and challenge sequence' 'Request lifecycle sequence' 'Decision lifecycle sequence' 'Moderation and tombstone overlay' 'Architecture decision and verification map' 'Failure semantics' 'Explicit non-claims'; do
  grep -Fiq "$phrase" docs/architecture/rfc-exchange.md || fail "missing RFC exchange architecture contract phrase: $phrase"
done

for route in '/' '/community/:slug/forum' '/create' '/create/:requestId' '/docs' '/docs/api' '/docs/specs'; do
  grep -Fq "\`$route\`" docs/product-boundary.md || fail "missing canonical route: $route"
done

for phrase in 'Matrix remains canonical' 'unprivileged client' "Hub's privileged adapter" 'Independently owned canonical community registry' 'request/status-first' 'visible unavailable' 'Deferred interpretation' 'Documentation precedence' 'Claim ledger' 'Explicit non-claims'; do
  grep -Fiq "$phrase" docs/authority-and-claims.md || fail "missing authority/claim contract phrase: $phrase"
done

for phrase in 'ZenithResearch/castalia-web' 'Rust/Dregg Castalia' 'duplicate guard' 'b6452489a78b2f4c004bbe44f47fc38d5bff62e8' 'issue #1' 'docs/issue-1-boundaries' 'pull request #3' 'Non-claims'; do
  grep -Fiq "$phrase" docs/repository-evidence.md || fail "missing repository evidence phrase: $phrase"
done

for phrase in 'Current fixture implementation' 'deterministic fixture shell' 'fixture BFF'; do
  grep -Fiq "$phrase" docs/product-boundary.md || fail "missing current product-state phrase: $phrase"
done

for phrase in 'Implemented fixture routes and APIs' 'fixture-only' 'live Matrix'; do
  grep -Fiq "$phrase" docs/authority-and-claims.md || fail "missing current claim-ledger phrase: $phrase"
done

for phrase in 'issue #2' 'pull request #4' '51fae5ee44aeefed0f23997c62950ed9d22e89fa' 'post-merge'; do
  grep -Fiq "$phrase" docs/repository-evidence.md || fail "missing I02 merge evidence phrase: $phrase"
done

for phrase in 'Issue #2' 'fixture implementation' 'pnpm verify'; do
  grep -Fiq "$phrase" docs/verification.md || fail "missing current verification phrase: $phrase"
done

if grep -Fq 'The current repository state. Contracts and non-claims are recorded; no application is scaffolded.' docs/product-boundary.md; then
  fail 'stale documentation-only state is still described as current'
fi

for phrase in 'future shell may keep' 'later UI issue must preserve'; do
  if grep -Fiq "$phrase" docs/authority-and-claims.md; then
    fail "stale future fixture-shell claim remains: $phrase"
  fi
done

doc_files='README.md docs/'\*.md' docs/reviews/'\*.md
for file in $doc_files; do
  links=$(perl -ne 'while (/\[[^]]+\]\(([^)#]+)(?:#[^)]+)?\)/g) { print "$1\n" unless $1 =~ m{^(?:https?://|mailto:|/)} }' "$file")
  if test -n "$links"; then
    base=$(dirname "$file")
    printf '%s\n' "$links" | while IFS= read -r link; do
      test -e "$base/$link" || fail "broken local link in $file: $link"
    done
  fi
done

if grep -Eni '(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|gh[opusr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|/Users/[^ /]+|/home/[^ /]+|/Volumes/[^ /]+)' $doc_files >/dev/null; then
  fail 'secret marker or private absolute path found in tracked documentation'
fi

printf 'PASS: required documentation files present\n'
printf 'PASS: canonical route inventory present\n'
printf 'PASS: authority and claim boundaries present\n'
printf 'PASS: repository bootstrap evidence present\n'
printf 'PASS: local Markdown links resolve\n'
printf 'PASS: no common secret markers or private absolute paths found\n'
printf 'PASS: documentation verification complete\n'
