---
status: accepted
date: 2026-11-26
decision-makers: oleksandrv
scope: stack
summary: "In the context of a note editor for iOS, web and desktop, facing a component that stored Markdown and all editing features will depend on, we decided on Milkdown 7 in an Expo DOM component and rejected Tiptap 3, TenTap, Lexical, react-native-enriched-html and a custom TextInput block editor, to achieve Markdown kept as written and one remark pipeline for client and server, accepting our own checklist node view and a smaller ecosystem."
supersedes: []
---

# Editor component

## Context and Problem Statement

The editor must show formatted text, read and write Markdown, hide the checklist id `^id`, and
let the app react to a typed `/` and `[[` ([SPEC §5.1 and §5.2](../SPEC.md),
[REQ-001](../requirements.md)). It has to work on iOS and the web from the one client of
[ADR 0001](0001-client-and-server-stack.md) and [ADR 0004](0004-scaffold-toolchain.md). Which
editor component do we use?

## Considered Options

* Milkdown 7 in an Expo DOM component
* Tiptap 3 in an Expo DOM component
* TenTap
* Lexical
* react-native-enriched-html
* A custom `TextInput` block editor

## Decision Outcome

Chosen option: "Milkdown 7 in an Expo DOM component" (`'use dom'`: Expo's WebView on iOS in Expo
Go, the DOM on the web and in Electron). The owner compared it with Tiptap in a spike and found
the two about the same to use on the iOS simulator. In the spike both round-tripped the
[canonical fixture](../../apps/client/src/editor-spike/fixture.ts) byte for byte, hid the id,
raised the `/` and `[[` triggers, worked on the web and in Electron, and ran in Expo Go on iOS.
What decides it:

* Markdown is the source of truth: bots read it over MCP, and export and import use it. On save,
  Milkdown keeps `<`, `&` and `_` in ordinary text (it escapes only `*`, `~` and `[`) and keeps
  `__bold__` and `_italic_` as written.
* Milkdown is built on remark and mdast, a pipeline the server can use in `packages/core`, which
  gives the one parser for client and server of [ADR 0001](0001-client-and-server-stack.md).

Rejected:

* Tiptap 3, because on save it rewrites ordinary text (`a < b & c` becomes `a &lt; b &amp; c`,
  `snake_case` becomes `snake\_case`) from a private method of `@tiptap/markdown` with no option;
  it also parses with `marked`, not remark.

The other four were dropped before the spike and not built:

* TenTap, because it is the same Tiptap engine behind another WebView bridge.
* Lexical, because its Markdown transformers are weaker and it would have brought a second schema
  system into the same comparison.
* react-native-enriched-html, because it is native, works in HTML rather than Markdown and needs
  a development build; its React Native 0.88 and web support were not verified.
* A custom `TextInput` block editor, because it has no rich inline editing.

### Consequences

* Good, because iOS, web and desktop share one editor engine
* Good, because Markdown stays closer to what was written, and the canonical fixture round-trips
  byte for byte
* Good, because client and server can share one remark pipeline
* Good, because the checklist id is never shown
* Good, because iOS runs it in Expo Go, with no native build
* Bad, because its GFM preset draws no checkbox, so the
  [checklist node view](../../apps/client/src/editor-spike/milkdown/plugins.ts) is our code
* Bad, because its [adapter](../../apps/client/src/editor-spike/milkdown/session.ts) needed
  about twice the code of Tiptap's
* Bad, because undo and redo need Milkdown's history plugin
* Bad, because a linked checklist item moved by dragging loses its id, as pasted content does;
  moves need their own rule before the WAW Tasks integration
* Bad, because its ecosystem is smaller than Tiptap's
* Bad, because the editor runs in a WebView on iOS
* Bad, because notes written in another Markdown style are restyled on save (`*` bullets, padded
  tables)

### Confirmation

The [Milkdown session tests](../../apps/client/src/editor-spike/milkdown/session.dom.test.ts)
carry REQ-001 AC-01 to AC-04. The
[spike screen](../../apps/client/src/editor-spike/EditorSpikeScreen.tsx), shown when the client
runs with `EXPO_PUBLIC_EDITOR_SPIKE=1`, runs the editor by hand.
