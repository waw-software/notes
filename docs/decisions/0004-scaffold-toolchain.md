---
status: accepted
date: 2026-11-26
decision-makers: oleksandrv
scope: stack
summary: "In the context of scaffolding the stack of ADR 0001, facing build tooling that is costly to change once code depends on it, we decided on one Expo app for iOS and the web, an Electron wrapper of its web export, a Fastify and TypeBox server, and Biome, strict TypeScript, Vitest and Jest in a pnpm workspace and rejected a bare React Native app with a separate Vite web app, Express or Hono, and ESLint with Prettier, to achieve one client codebase and one API contract, accepting that Expo SDK upgrades pace React Native."
supersedes: []
---

# Scaffold toolchain and workspace layout

## Context and Problem Statement

[ADR 0001](0001-client-and-server-stack.md) chose React Native with React Native Web, Electron,
a Node and TypeScript server, and a pnpm monorepo, and left the tooling to the scaffold. Which
tools and workspace layout does the scaffold build on?

## Considered Options

* The scaffold set: Expo, an Electron wrapper, Fastify with TypeBox, and Biome
* A bare React Native CLI app with a separate Vite web app
* Express or Hono instead of Fastify
* ESLint with Prettier instead of Biome

## Decision Outcome

Chosen option: "The scaffold set: Expo, an Electron wrapper, Fastify with TypeBox, and Biome",
because it keeps one client app for all three clients and one API contract.

* [`apps/client`](../../apps/client/package.json) is one Expo-managed app for iOS and the web,
  with a Metro single-page web export to `apps/client/dist`, so one app serves both.
* [`apps/desktop`](../../apps/desktop/src/main/index.ts) is an Electron main process, built with
  electron-vite, that serves that export over a secure `waw-notes://app/` protocol, because the
  export's root-relative asset URLs break under `file://`.
* [`apps/server`](../../apps/server/package.json) is one package with the API and Worker entry
  points; it uses Fastify with TypeBox schemas shared through
  [`packages/api-contract`](../../packages/api-contract/src/index.ts), so the contract has one
  definition.
* [`packages/core`](../../packages/core/package.json) is the home of the shared Markdown parser,
  so clients and server can use the same one; the scaffold leaves its module empty.
* Biome does format and lint, so one tool covers both.
* TypeScript runs in strict mode, so type errors fail the type check.
* Vitest tests the packages, the server and the desktop app; Jest with `jest-expo` tests the
  client, because it is Expo's Jest preset.
* Node 24.21.0 ([`.nvmrc`](../../.nvmrc), also the minimum engine) and pnpm 12.21.0
  ([`package.json`](../../package.json)) are pinned, to give one reference toolchain.
* pnpm uses the isolated linker ([`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)), which
  keeps pnpm's strict per-package dependencies.

Rejected: a bare React Native CLI app with a separate Vite web app, because the web would be a
second app with its own renderer setup, as the separate Vite web app is in WAW Tasks; Express or Hono, because Fastify with TypeBox binds the shared schema to a
route and tests it in process; ESLint with Prettier, because they are two tools for what Biome
does alone.

### Consequences

* Good, because the web and desktop clients come from one client codebase and one bundle
* Good, because the server's responses and the shared types come from one contract
* Bad, because Expo SDK upgrades pace React Native upgrades
* Bad, because iOS runs through Expo Go until a native build is needed

### Confirmation

[`scripts/check.sh`](../../scripts/check.sh) runs format, lint, type and unit test checks. The
REQ-021 AC-57 test [`apps/server/test/health.test.ts`](../../apps/server/test/health.test.ts)
covers `GET /health`.
