#!/bin/sh
set -eu

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

required='README.md docs/product-boundary.md docs/authority-and-claims.md docs/repository-evidence.md docs/verification.md'
for file in $required; do
  test -f "$file" || fail "missing required file: $file"
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

doc_files='README.md docs/'\*.md
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
