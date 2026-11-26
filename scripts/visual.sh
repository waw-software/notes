#!/usr/bin/env bash
# The visual check: captures the screens a change touches next to their mockups and writes
# index.html. Not part of scripts/check.sh.
# Usage: scripts/visual.sh [--all] [--ios] [--out <dir>] [<screen-id>...]
set -euo pipefail
cd "$(dirname "$0")/.."
exec node apps/e2e/visual/run.ts "$@"
