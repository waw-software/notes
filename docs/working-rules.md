# Working rules

## Rules

- [SPEC.md](SPEC.md) marks every item **Decided** or **Proposed**. Do not change a Decided item without asking. You may build on a Proposed item, but list it in your PR description so it can be confirmed.
- Do not build what the spec lists as out of scope. In particular: no plugins or settings for the editor, no nested notebooks, no databases, no graph view.
- The block list is fixed at ten. Do not add an eleventh, and do not build an extension point for one.
- The note body in Markdown is the only source of truth. Tags, links, backlinks and the search index are derived from it.
- Saving and showing a note never waits for the network.
- Open a screen's mockup before you build that screen. Mobile mockups are in [design/mobile/](design/mobile/), desktop in [design/desktop/](design/desktop/), PNG exports (when present) in [design/screens/](design/screens/). [design/README.md](design/README.md) says how to read the screen mockups.
- Take colours, type and sizes from the tokens in [DESIGN.md](DESIGN.md). Do not hard-code values in components and do not invent new colours.
- The mockups are a visual reference. Do not copy their HTML or inline styles into the app.
- Where a mockup disagrees with [SPEC.md](SPEC.md) or [DESIGN.md](DESIGN.md), the documents win. Known gaps are listed in [DESIGN.md section 9](DESIGN.md#9-known-gaps-in-the-mockups).
- UI copy is in English. Use the wording from the mockups.
- Client and server share request and response types, and the Markdown parser, through shared packages. Change the shared package first, then both sides.
- API changes within a major version only add. Gate new client features on the capabilities from `GET /health`.
- If something is not covered by the documents, pick the simplest option that fits them, and say so in the PR.
- Record the choice of the editor component in a decision record under [decisions/](decisions/README.md).

## How to work

- Follow the build order in [SPEC.md section 8](SPEC.md#8-build-order-proposed), one vertical slice per PR: API, screen and tests together.
- Slice 0 is a spike on the editor component. Do it first; much of the plan depends on its result.
- Each slice must run end to end against a real server started from the compose file.
- After each slice that changes a screen, run `scripts/visual.sh`: it captures the touched screens at 390 px, at 1440 px, in the Electron window and, with `--ios` on a Mac, in the iOS simulator, next to their mockups from [design/screens/](design/screens/).
  A slice that adds a screen first registers it in `apps/e2e/visual/screens.json` (path, source files, mockup names, or `null` when there is no mockup).
  The tester lists every difference from the mockup that is left in a `## Visual check` section of the pull request.

## Related apps

- WAW Tasks is a separate repository and server. The integration in [SPEC.md section 5.7](SPEC.md#57-waw-tasks-integration) needs one additive change there (a task's source). Do not start slice 12 before that change exists.
- WAW Bot reaches this server only through `/mcp`.
