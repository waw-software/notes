---
status: proposed
date: 2026-11-26
decision-makers: oleksandrv
scope: stack
summary: "In the context of a note editor for iOS, web and desktop, facing a component that stored Markdown and all editing features will depend on, we propose Tiptap 3 in an Expo DOM component and reject Milkdown 7, TenTap, Lexical, react-native-enriched-html and a custom TextInput block editor, to achieve one editor engine for all three clients, accepting that it runs in a WebView on iOS and rewrites some ordinary text on save."
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

* Tiptap 3 in an Expo DOM component
* Milkdown 7 in an Expo DOM component
* TenTap
* Lexical
* react-native-enriched-html
* A custom `TextInput` block editor

## Decision Outcome

Proposed option: "Tiptap 3 in an Expo DOM component" (`'use dom'`: Expo's WebView on iOS in Expo
Go, the DOM on the web and in Electron). In a spike on one
[canonical fixture](../../apps/client/src/editor-spike/fixture.ts), it passed every criterion
measured on the web, loaded, exported byte for byte and took an edit in Electron, and loaded,
rendered the note with the id hidden and exported it byte for byte on an iOS simulator. Pasting
and line breaks in a linked checklist item were checked in unit tests only. Its
[adapter](../../apps/client/src/editor-spike/tiptap/session.ts) needs less code than
[Milkdown's](../../apps/client/src/editor-spike/milkdown/session.ts), it includes undo and redo,
which Milkdown's presets do not, and in a unit test a linked item moved by dragging kept its id,
which Milkdown dropped.

Rejected:

* Milkdown 7, because checklist Enter still failed in a real browser after two fix rounds, with
  the custom node view it needs since its GFM preset has no checkbox; it was not run on iOS.

The other four were dropped before the spike and not built:

* TenTap, because it is the same Tiptap engine behind another WebView bridge.
* Lexical, because its Markdown transformers are weaker and it would have brought a second schema
  system into the same comparison.
* react-native-enriched-html, because it is native, works in HTML rather than Markdown and needs
  a development build; its React Native 0.88 and web support were not verified.
* A custom `TextInput` block editor, because it has no rich inline editing.

### Consequences

* Good, because iOS, web and desktop share one editor engine
* Good, because the canonical fixture, in the app's own Markdown style, round-trips byte for byte
* Good, because the hidden id is an attribute of the checklist item node, so it is never shown
* Good, because iOS runs it in Expo Go, with no native build
* Bad, because on save it rewrites some ordinary text with HTML entities and escapes (`<` becomes
  `&lt;`, `_` becomes `\_`), which the fixture does not contain; it needs a custom text serializer
  before notes are stored (M6/M7), and the spike did not build one
* Bad, because the editor runs in a WebView on iOS
* Bad, because notes written in another Markdown style are restyled on save; the owner requires
  a byte-identical round trip for the canonical style only

### Confirmation

The [Tiptap session tests](../../apps/client/src/editor-spike/tiptap/session.dom.test.ts) carry
REQ-001 AC-01 to AC-04. The
[spike screen](../../apps/client/src/editor-spike/EditorSpikeScreen.tsx), shown when the client
runs with `EXPO_PUBLIC_EDITOR_SPIKE=1`, runs the editor by hand.

Not checked yet: typing on iOS (editing, Enter, `/` and `[[`); the owner checks it before
accepting this record.
