#!/usr/bin/env bash
# Unit tests of the workspace: offline and deterministic.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
if [ ! -d node_modules ]; then
  echo "FAIL: dependencies are not installed; run scripts/env.sh setup"
  exit 1
fi
exec scripts/project/quiet.sh "test:unit" scripts/project/pnpm.sh run test:unit
