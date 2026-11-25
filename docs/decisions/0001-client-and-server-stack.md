---
status: accepted
date: 2026-11-26
decision-makers: oleksandrv
scope: stack
summary: "In the context of a notes app with iOS, web and desktop clients and a self-hosted server, facing the cost of several client codebases and parsers, we decided on React Native with React Native Web, Electron and a Node and TypeScript server in a pnpm monorepo and rejected separate native clients and Flutter, to achieve one client codebase for iOS and web and one parser for client and server, accepting that the editor component is still an open risk."
supersedes: []
---

# Client and server stack

## Context and Problem Statement

Which stack builds the iOS, web and desktop clients and the server? The clients and the server
have to read the same Markdown the same way. See [SPEC section 3](../SPEC.md#3-architecture)
and the [requirements](../requirements.md).

## Considered Options

* React Native with React Native Web, Electron wrapping the web build, a Node and TypeScript
  server, and a pnpm monorepo with shared `packages/api-contract` and `packages/core`
* Separate native iOS (Swift) and web (React) clients
* Flutter for iOS, web and desktop

## Decision Outcome

Chosen option: "React Native with React Native Web, Electron wrapping the web build, a Node and
TypeScript server, and a pnpm monorepo with shared `packages/api-contract` and
`packages/core`", because it gives one client codebase for iOS and web and one parser shared by
client and server. The layout, the local store and the search choices are in
[SPEC section 3](../SPEC.md#3-architecture).

The editor component is **not** decided here: the slice-0 spike chooses it, and a later
decision record records the choice.

Rejected: separate native iOS (Swift) and web (React) clients, because they mean two codebases
and two parsers; Flutter, because it shares no TypeScript parser or contract with the server.

### Consequences

* Good, because iOS and web come from one client codebase
* Good, because client and server share one Markdown parser and the API contract
* Bad, because the editor has to work on both React Native and React Native Web, which is the
  riskiest choice still open

### Confirmation

Not checked yet: the scaffold pull request pins the toolchain and the workspace layout; the
slice-0 spike confirms that React Native Web can host the editor.
