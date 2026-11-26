# WAW Notes: product and technical spec

Status: first version, written from the design sessions on 25 and 26 Nov 2026. Updated on 26 Nov 2026 with the owner's decisions on the stack and import.
This file is the source of truth for behaviour. `DESIGN.md` is the source of truth for look.

Every item below is marked one of two ways:

- **Decided**: agreed with the product owner, in words or by approving the design and the whiteboard. Do not change without asking.
- **Proposed**: a sensible default that was never explicitly confirmed. You may build on it, but flag it in your PR so it can be confirmed or changed.

## 1. What it is

WAW Notes is a self-hosted notes app. It sits between Notion, Obsidian and Notesnook. (Decided)

What it takes from each, and what it leaves (Decided):

- From Obsidian: Markdown underneath, links between notes with backlinks, offline use, notes you can take out as `.md` files. It leaves out plugins and configuration. Obsidian is a great editor, but it is hard to use without setting it up yourself.
- From Notion: a clean editor, a slash menu, emoji icons on notebooks. It leaves out databases and nested pages. Notion is overloaded and slow.
- From Notesnook: a self-hosted server and sync. It adds a friendlier interface and MCP access for bots.

It is the third app in the WAW family, after WAW Bot and WAW Tasks. Each app is a client plus a server that the user deploys on their own machine. (Decided)

Principles (Decided):

- Nothing to set up. There are no plugins, no themes and no editor settings. Everything works on first run.
- Fast. The client keeps a full local copy and never waits for the server to show or save a note.
- The server belongs to the user. They deploy it, for example on Coolify, and connect clients to it.
- The interface is minimal but not empty.
- Notes are plain Markdown and can be exported at any time.
- Bots are first-class users. WAW Bot reads and writes notes through MCP.

## 2. Scope

In scope for v1 (Decided):

- Notes written in a formatted editor and stored as Markdown.
- A fixed set of ten blocks, inserted with a slash menu or with Markdown shortcuts.
- Notebooks with an emoji icon or a default icon. Notebooks are flat.
- Tags written as `#tag` in the note.
- Links between notes written as `[[`, with backlinks ("Linked from").
- Pinned notes.
- Full-text search with notebook and tag chips. Search works offline.
- Desktop: three-pane layout, a note info panel, a quick switcher on Ctrl or Cmd + K.
- Offline use with later sync.
- Connect by server URL and token, by pairing link, or by scanning a QR code.
- MCP endpoint for bots, with its own token. A note created by a bot says so.
- WAW Tasks integration: a checklist item can become a task and stay in sync.
- Export all notes as Markdown.
- Import of Markdown files, from Obsidian or any folder of `.md` files.
- Clients: iOS app, web client, Electron desktop app.

Explicitly out of scope (Decided). Do not build these, even if they seem natural:

- Plugins, themes, custom CSS, editor settings.
- Databases, boards, calendars or any other typed views of notes.
- Nested notebooks and nested pages.
- A graph view of links.
- Daily notes.
- Reminders and push notifications. Dated work belongs in WAW Tasks.
- Sharing, collaboration, comments, multiple users on one server.
- A hosted cloud version.

Out of scope, Proposed:

- End-to-end encryption. The server reads note text to build links, tags, search and MCP answers.
- Version history of a note.

## 3. Architecture

```
iOS app / web client / Electron  --HTTPS-->  reverse proxy
                                                 |
                                                API  --queue-->  Worker  <-->  WAW Tasks server
                                                 |                  |
WAW Bot and other bots  --MCP /mcp-->           Postgres  <---------+
```

Decided:

- The server is delivered as a ready Docker image plus a `docker-compose.yml` with two services: the server and Postgres.
- API and Worker live in the same image.
- The Worker parses notes into links, tags and checklist items, maintains the search index, and keeps linked items in sync with WAW Tasks.
- Postgres holds notes, the search index and the job queue. There is no Redis.
- Image files live on a volume on the server. Postgres holds their metadata.
- The web client ships inside the server image and is served by it.
- Bots connect through an MCP endpoint at `/mcp`.
- There is no push relay. WAW Notes sends no push notifications.

Decided, the stack ([ADR 0001](decisions/0001-client-and-server-stack.md)):

- pnpm monorepo: `apps/client`, `apps/server`, `packages/api-contract`, `packages/core`. The Markdown parser lives in `packages/core`, so client and server parse the same way.
- Client in React Native with React Native Web, one codebase for iOS and web. Electron wraps the web build.
- Server in Node and TypeScript.
- Local store on the client in SQLite (IndexedDB on web), with a local full-text index.
- Search on the server with Postgres full-text search.

Proposed:

- The editor component is the riskiest choice in the project: it must edit formatted text, read and write Markdown, and work on iOS and web. Pick it in a spike before the first slice, and record the choice in a decision record ([ADR 0005](decisions/0005-editor-component.md)).

### 3.1 Deployment and first run

Same model as WAW Tasks.

Decided:

- The user starts the server with `docker compose up -d`, or deploys the same compose file from Coolify.
- Updating is `docker compose pull && docker compose up -d`. Database migrations run automatically on start.
- First run shows a setup page with the server address, an access token, a pairing link and a QR code that carries the address and a one-time token.

Proposed:

- Minimal configuration: the public URL. Secrets are generated on first start.
- Take a database dump before running migrations.

### 3.2 Versioning between client and server

Decided:

- `GET /health` returns the API version and a list of capabilities, for example `{"apiVersion": 1, "capabilities": ["tasks-link", "import"]}`.
- The client turns a feature on when its capability is listed, not by comparing version numbers.
- Within one major API version, change only by adding. Never remove or rename fields.
- When the server is too old, the client says the server needs an update and still lets the user continue with limited features.
- Deprecation is soft: warn first, block later.

### 3.3 Auth

Decided: bots use a separate token, created in Settings under "WAW Bot access".

Proposed:

- One user per server.
- Each client device holds its own access token. Tokens can be revoked individually.

## 4. Data model

Tables (the set is Decided; column names are Proposed):

| Table | Holds |
| --- | --- |
| `notebooks` | id, name, icon (an emoji, or null for the default icon), position |
| `notes` | id, notebook_id, title, body (Markdown), pinned, created_by, created_at, edited_at |
| `tags` | id, name |
| `note_tags` | note_id, tag_id. Rebuilt from the note text |
| `links` | from_note_id, to_note_id. Rebuilt from the note text; backlinks are read from here |
| `task_links` | note_id, item_id (the checklist item), task_id (in WAW Tasks), done, synced_at |
| `files` | id, note_id, name, type, size, path on the volume |
| `connections` | the WAW Tasks server address and token |
| `changes` | sequence, entity, entity_id, operation, payload, created_at. The log clients sync from |

Every synced row also needs `updated_at` and a soft-delete marker. (Proposed)

`created_by` records who made the note: the user or a named bot. The design shows "added by Noter in WAW Bot". (Decided that this is shown; the column is Proposed.)

`tags`, `note_tags`, `links` and the search index are derived data. The note body is the only source; the Worker rebuilds the rest after every change. (Proposed)

## 5. Behaviour

### 5.1 The note format

Decided:

- A note is Markdown. The editor shows formatted text and never the raw syntax.
- `[[Note title]]` links to another note.
- `#tag` adds a tag.
- A checklist item linked to WAW Tasks carries a stable id in the Markdown, written at the end of the line as `^a1b2`, like a block id in Obsidian. The editor hides it.

Proposed:

- CommonMark plus GitHub task lists and tables.
- The title is a separate field, not the first line of the body.
- Links resolve by note id through the `links` table, so renaming a note does not break them. On rename, the server rewrites the title inside `[[...]]` in the notes that link to it.

### 5.2 The editor

Decided:

- There are exactly ten blocks. The list is fixed and cannot be extended.

| Block | Markdown shortcut |
| --- | --- |
| Heading | `#` |
| Bulleted list | `-` |
| Numbered list | `1.` |
| Checklist | `[]` |
| Quote | `>` |
| Code | three backticks |
| Table | none |
| Image | none |
| Divider | `---` |
| Link to note | `[[` |

- Typing `/` opens the block menu. On mobile it is a sheet with all ten blocks; on desktop a popover that also shows the shortcut for each.
- Typing a Markdown shortcut converts in place.
- Typing `[[` opens the note picker: matching notes, plus "Create note" with the typed text.
- Mobile has a toolbar above the keyboard: text style, bold, bulleted list, checklist, link to note, insert block.
- A note saves as you type. The header shows "Saved", or "Saved and synced" on desktop.

Proposed: inline formatting is bold, italic, inline code and web links.

### 5.3 Notebooks, tags, pins

Decided:

- Notebooks are a flat list. A notebook has a name and an icon: any emoji, or the default icon when none is picked.
- Tags come only from `#tag` in note text. The tag list shows a count for each. Opening a tag opens search filtered by it.
- A pinned note appears in "Pinned" on the home screen and in the sidebar view.

Proposed:

- Every note belongs to exactly one notebook. A note created from the home screen goes to the notebook used last.

### 5.4 Links and backlinks

Decided:

- A link is shown as underlined accent text. Opening it opens the note.
- Each note lists the notes that link to it under "Linked from". On desktop the note info panel also lists "Links to".
- Creating a link tells the user that the other note will list this one.

### 5.5 Search

Decided:

- Full-text search across all notes, with matches highlighted in the result snippet.
- Chips narrow the search to a notebook or a tag.
- Search reads the notes stored on the device, so it works offline.
- Desktop has a quick switcher on Ctrl or Cmd + K: it finds notes by title, and offers "Create note" and "Search inside all notes" for the typed text.

### 5.6 Offline and sync

Decided:

- The client works without the server. Everything stays readable and editable.
- Changed notes are marked "not synced yet". A banner says how many are waiting and offers Retry.
- When two devices changed the same note while apart, the latest version wins and the other one is kept next to it as a conflicted copy. Text is not merged.

Proposed:

- The client keeps a full local copy and a queue of outgoing operations.
- The server assigns each change a sequence number. A client asks for everything after the last sequence it has seen.

### 5.7 WAW Tasks integration

Decided:

- The user connects WAW Tasks once, in Settings, with the WAW Tasks server URL and a token. The Notes server talks to the Tasks server directly; the clients do not.
- The token is created in WAW Tasks under Settings, "WAW Bot access". It is the same kind of token bots use.
- Any checklist item can be sent to WAW Tasks. Sending opens the same quick add as in WAW Tasks: the item text, with date, priority and project typed in natural language, inline highlighting, and an "Understood as" row.
- The item stays in the note and shows a chip, for example "In WAW Tasks · Fri".
- Only the done state stays in sync, in both directions. The title is copied once, when the task is created.
- Opening the chip shows the task's due date, project and status, with three actions: open in WAW Tasks, mark as done, unlink.
- Unlinking keeps both the item and the task. They stop syncing.
- The task in WAW Tasks shows where it came from ("From a note") and links back to the note.
- The Worker learns about changes in WAW Tasks by reading its change log (`GET /sync?after=`), like any other client. There are no webhooks.
- On desktop, the note info panel lists the tasks linked from the note.

Proposed:

- Use `POST /parse` on the Tasks server to parse the quick-add text, so Notes never has its own copy of that grammar.
- Poll the Tasks change log about once a minute, and immediately after the user acts on a linked item.

Needed in WAW Tasks, not built yet:

- A task must be able to store its source: the app, the note id, the note title and a link. WAW Tasks shows it as "From a note". Neither the WAW Tasks spec nor its design has this yet. Add it there as an additive API change behind a capability.

### 5.8 Bots

Decided:

- Bots can search, read and add notes through MCP.
- Settings shows the MCP URL and creates the bot token.
- A note created through MCP records the bot's name and shows it in lists.

### 5.9 Import and export

Decided:

- "Export all notes as Markdown" produces the notes as `.md` files.
- Import takes a folder or zip of `.md` files: each folder becomes a notebook, `[[links]]` and `#tags` are kept.

Proposed:

- Export is a zip with one folder per notebook and the images beside the notes.

## 6. API sketch (Proposed)

REST, JSON, token in the `Authorization` header.

- `GET /health`
- `GET /sync?after=<sequence>` and `POST /sync` (batch of client operations)
- `GET|POST /notes`, `GET|PATCH|DELETE /notes/:id`
- `GET /notes/:id/backlinks`
- `GET|POST /notebooks`, `PATCH|DELETE /notebooks/:id`
- `GET /tags`
- `GET /search?q=&notebook=&tag=`
- `POST /files`, `GET /files/:id`
- `PUT|DELETE /connections/tasks`
- `POST /notes/:id/items/:itemId/task` creates the task; `DELETE` unlinks it
- `POST /export`, `POST /import`
- `POST /tokens` creates a device or bot token

Put request and response schemas in `packages/api-contract` and import them on both sides.

## 7. MCP tools (Proposed names)

`search_notes`, `get_note`, `create_note`, `append_to_note`, `update_note`, `list_notebooks`, `list_tags`.

`create_note` takes a notebook name, a title and a Markdown body.

## 8. Build order (Proposed)

Work in vertical slices. Each slice includes the API, the screen and a test.

0. Editor spike: prove formatted editing with Markdown in and out, on iOS and web. Decide the component.
1. Design tokens and base components (see `DESIGN.md`).
2. Server skeleton: `/health`, auth, migrations, Docker image and compose file.
3. Connect flow: URL and token, connection check, pairing.
4. Notes home and a note, read only. Then create and edit with plain paragraphs.
5. The ten blocks, the slash menu and the Markdown shortcuts.
6. Notebooks, with name and icon.
7. Tags, links between notes, backlinks.
8. Search, then the desktop quick switcher.
9. Desktop layout: three panes and the note info panel.
10. Offline queue and sync, conflicted copies, the offline and old-server states.
11. MCP endpoint and bot token.
12. WAW Tasks integration. Needs the source field in WAW Tasks first.
13. Export, then import.
14. Electron shell: tray, launch at login, quick note shortcut.

## 9. Open questions

- What happens to a deleted note: gone at once, or a trash for some days?
- What happens to the notes of a deleted notebook?
- Where does a new note go when no notebook is open? See 5.3.
- Should the web client need the token on every visit, or keep a session?
- Size limit for images.
