#!/usr/bin/env bash
# Format, lint and type checks of the workspace; every step runs, any failure fails the check.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
if [ ! -d node_modules ]; then
  echo "FAIL: dependencies are not installed; run scripts/env.sh setup"
  exit 1
fi
failed=0
scripts/project/quiet.sh "format:check" scripts/project/pnpm.sh run format:check || failed=1
scripts/project/quiet.sh "lint" scripts/project/pnpm.sh run lint || failed=1
scripts/project/quiet.sh "typecheck" scripts/project/pnpm.sh run typecheck || failed=1
exit "$failed"
