---
status: accepted
date: 2026-11-26
decision-makers: oleksandrv
scope: stack
summary: "In the context of clients for the web, desktop and iOS and a server, facing the need for end-to-end tests and a repeatable comparison with the mockups, we decided on Playwright for the web, the Electron window and the server, with iOS simulator screenshots and a side-by-side report and rejected Cypress, Detox or Maestro for iOS, and Playwright pixel snapshots, to achieve one runner and evidence a person can read, accepting that nothing fails automatically on visual drift and that the iOS capture is timing-based and Mac-only."
supersedes: []
---

# End-to-end tests and visual check tooling

## Context and Problem Statement

The project needs end-to-end tests of the web client, the Electron window and the server, and a
repeatable way to compare built screens with their mockups, as the
[working rules](../working-rules.md) ask and the [design guide](../design/README.md) describes
the mockups. Which tools do the specs and the visual check build on?

## Considered Options

* Playwright for the web and the Electron window (`_electron`), with iOS simulator screenshots
  and a side-by-side report
* Cypress
* Detox or Maestro for iOS
* Playwright `toHaveScreenshot` pixel snapshots

## Decision Outcome

Chosen option: "Playwright for the web and the Electron window (`_electron`), with iOS simulator
screenshots and a side-by-side report", because one runner covers the web, the desktop window and
the server API, and a person judges each screen against its mockup.

* [`playwright.config.ts`](../../apps/e2e/playwright.config.ts) defines the runner and its
  projects.
* [`scripts/project/e2e.sh`](../../scripts/project/e2e.sh) runs the end-to-end tests, which are
  not part of the full check.
* [`screens.json`](../../apps/e2e/visual/screens.json) registers the screens of the visual check.
* iOS shots come from the simulator through Expo Go, only on request, on a Mac, and never in CI,
  because [ADR 0004](0004-scaffold-toolchain.md) keeps iOS on Expo Go.
* The report is HTML for a person; no pixels are compared automatically.

Rejected: Cypress, because it does not drive an Electron app; Detox or Maestro for iOS, because
they need a native or development build and ADR 0004 keeps Expo Go; Playwright `toHaveScreenshot`
pixel snapshots, because no screen matches a mockup yet and the mockups carry sample data.

### Consequences

* Good, because one runner covers the web, the desktop window and the API
* Good, because the visual check leaves evidence a person can read in the pull request
* Bad, because no automatic gate catches visual drift
* Bad, because the iOS capture is timing-based and works only on a Mac
* Bad, because the Expo Go overlay shows on iOS screenshots
* Bad, because the end-to-end tests need xvfb on Linux without a display

### Confirmation

[`.github/workflows/e2e.yml`](../../.github/workflows/e2e.yml) runs `scripts/env.sh e2e` on every
pull request.
