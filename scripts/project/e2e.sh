#!/usr/bin/env bash
# End-to-end tests (E2E in .claude/harness.conf): builds the server, the web export, and the
# desktop app, then runs the Playwright specs. Not part of scripts/check.sh.
#
# Usage: scripts/project/e2e.sh [build|test|all]
set -euo pipefail
cd "$(dirname "$0")/../.."
pnpm=scripts/project/pnpm.sh

build() {
  "$pnpm" build:shared
  "$pnpm" --filter @waw-notes/server run build
  "$pnpm" --filter @waw-notes/client run build
  "$pnpm" --filter @waw-notes/desktop run build
  "$pnpm" --filter @waw-notes/desktop exec install-electron
}

run_tests() {
  local display=()
  if [ "$(uname)" = Linux ] && [ -z "${DISPLAY:-}" ]; then
    display=(xvfb-run -a)
  fi
  # The ${a[@]+...} form keeps an empty array valid under set -u in bash 3.2 (macOS).
  ${display[@]+"${display[@]}"} "$pnpm" --filter @waw-notes/e2e exec playwright test \
    --project server --project web-390 --project web-1440 --project electron
}

case "${1:-all}" in
  build) build ;;
  test) run_tests ;;
  all) build; run_tests ;;
  *) echo "usage: scripts/project/e2e.sh [build|test|all]" >&2; exit 2 ;;
esac
