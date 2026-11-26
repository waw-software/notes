#!/usr/bin/env bash
# Usage: scripts/project/check-edit.sh <repo-relative-path>
# The check after every edit (CHECK_EDIT in .claude/harness.conf): format and lint of one file;
# both run, any failure fails the check.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
biome=node_modules/.bin/biome
if [ ! -x "$biome" ]; then
  echo "SKIP: run scripts/env.sh setup first"
  exit 0
fi
failed=0
"$biome" format --no-errors-on-unmatched "$1" || failed=1
"$biome" lint --error-on-warnings --no-errors-on-unmatched "$1" || failed=1
exit "$failed"
