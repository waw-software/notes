# Requirements

These requirements come from the **Decided** items of [SPEC](SPEC.md), plus the owner's decision of 26 Nov 2026 that import is in v1; SPEC holds the rationale.

## Notes and editor

REQ-001: A note is written in a formatted editor and stored as Markdown.
AC-01: Given a note with formatted content, when the user views it in the editor, then it is shown as formatted text with no raw Markdown syntax.
AC-02: Given a note edited in the editor, when it is stored, then its body is Markdown.
AC-03: Given a checklist item linked to WAW Tasks, when the note is stored, then the item's line ends with a stable id of the form `^a1b2`.
AC-04: Given a checklist item linked to WAW Tasks, when the note is shown in the editor, then the id at the end of the line is hidden.

REQ-002: The editor offers exactly ten blocks: Heading, Bulleted list, Numbered list, Checklist, Quote, Code, Table, Image, Divider and Link to note.
AC-05: Given the editor, when the user opens the block menu, then it lists exactly these ten blocks and offers no way to add another.
AC-06: Given a note on mobile, when the user types `/`, then a sheet opens with all ten blocks.
AC-07: Given a note on desktop, when the user types `/`, then a popover opens with all ten blocks and shows the Markdown shortcut of each block that has one.

REQ-003: Typing a Markdown shortcut inserts the matching block.
AC-08: Given a note in the editor, when the user types the shortcut `#`, then the text converts in place to a heading.
AC-09: Given a note in the editor, when the user types the shortcut `-`, then the text converts in place to a bulleted list.
AC-10: Given a note in the editor, when the user types the shortcut `1.`, then the text converts in place to a numbered list.
AC-11: Given a note in the editor, when the user types the shortcut `[]`, then the text converts in place to a checklist.
AC-12: Given a note in the editor, when the user types the shortcut `>`, then the text converts in place to a quote.
AC-13: Given a note in the editor, when the user types three backticks, then the text converts in place to a code block.
AC-14: Given a note in the editor, when the user types the shortcut `---`, then the text converts in place to a divider.

REQ-004: The mobile client has an editing toolbar above the keyboard.
AC-15: Given a note on mobile, when the keyboard is open, then a toolbar above it offers text style, bold, bulleted list, checklist, link to note and insert block.

REQ-005: A note saves as the user types.
AC-16: Given an open note on mobile, when the user types and the note is saved, then the header shows "Saved".
AC-17: Given an open note on desktop, when the user types and the note is saved and synced, then the header shows "Saved and synced".

REQ-006: The app works on first run with nothing to set up in the editor or the interface.
AC-18: Given a newly connected client, when the user creates a note, then the editor works without any plugin, theme or editor setting being chosen.

## Notebooks, tags and pins

REQ-007: Notes are organised in a flat list of notebooks, each with a name and an icon.
AC-19: Given the notebook list, when the user views it, then every notebook is at one level, with none inside another.
AC-20: Given a notebook, when the user picks any emoji as its icon, then the notebook is shown with that emoji.
AC-21: Given a notebook with no emoji picked, when it is shown, then it has the default icon.

REQ-008: Tags come only from `#tag` written in note text.
AC-22: Given a note, when the user writes `#tag` in its text, then the note gets that tag.
AC-23: Given notes with tags, when the user views the tag list, then each tag shows its count.
AC-24: Given the tag list, when the user opens a tag, then search opens filtered by that tag.

REQ-009: The user can pin a note.
AC-25: Given a note, when the user pins it, then it appears in "Pinned" on the home screen.
AC-26: Given a pinned note, when the user opens the "Pinned" view from the sidebar, then the note is listed in it.

## Links

REQ-010: A note can link to another note with `[[Note title]]`.
AC-27: Given a note in the editor, when the user types `[[` followed by text, then the note picker shows the matching notes and "Create note" with the typed text.
AC-28: Given a note containing a link to another note, when it is shown, then the link is underlined accent text.
AC-29: Given a shown link to a note, when the user opens it, then the linked note opens.
AC-30: Given a note in the editor, when the user creates a link to another note, then the user is told that the other note will list this one.

REQ-011: Each note shows its links to and from other notes.
AC-31: Given a note that other notes link to, when the user views it, then those notes are listed under "Linked from".
AC-32: Given a note on desktop that links to other notes, when the user views the note info panel, then those notes are listed under "Links to".

## Search

REQ-012: The user can search the full text of all notes.
AC-33: Given notes that contain a word, when the user searches for it, then the matching notes are listed with the match highlighted in the result snippet.
AC-34: Given search results, when the user selects a notebook chip, then only results from that notebook remain.
AC-35: Given search results, when the user selects a tag chip, then only results with that tag remain.
AC-36: Given a device without a connection to the server, when the user searches, then results come from the notes stored on the device.

## Desktop

REQ-013: The desktop interface has a three-pane layout and a note info panel.
AC-37: Given the desktop interface, when the user works with notes, then it shows a three-pane layout.
AC-38: Given a note open on desktop, when the user views the note info panel, then it shows information about that note.

REQ-014: The desktop interface has a quick switcher.
AC-39: Given the desktop interface, when the user presses Ctrl or Cmd + K, then the quick switcher opens.
AC-40: Given the open quick switcher, when the user types text from a note title, then that note is listed.
AC-41: Given the open quick switcher, when the user types text, then "Create note" and "Search inside all notes" are offered for that text.

## Offline and sync

REQ-015: The client works without the server.
AC-42: Given a client that cannot reach the server, when the user opens a note, then it can be read and edited.
AC-43: Given a client with a slow or unreachable server, when the user opens or edits a note, then showing and saving it do not wait for the server.

REQ-016: The client shows which changes are waiting to sync.
AC-44: Given a changed note that has not reached the server, when it is shown, then it is marked "not synced yet".
AC-45: Given changed notes waiting to sync, when the user views the app, then a banner says how many are waiting and offers Retry.

REQ-017: Sync keeps both versions of a note changed on two devices while apart.
AC-46: Given two devices that changed the same note while apart, when both have synced, then the latest version is the note.
AC-47: Given two devices that changed the same note while apart, when both have synced, then the other version is kept next to the note as a conflicted copy, with no text merged.

## Connect and first run

REQ-018: The first run of the server gives the user what is needed to connect a client.
AC-48: Given a newly started server, when the user opens it for the first time, then a setup page shows the server address, an access token, a pairing link and a QR code.
AC-49: Given the setup page, when the QR code is decoded, then it carries the server address and a one-time token.

REQ-019: The user can connect a client to their server in three ways.
AC-50: Given an unconnected client, when the user enters the server URL and a token, then the client connects to that server.
AC-51: Given an unconnected client, when the user uses a pairing link, then the client connects to the server it names.
AC-52: Given an unconnected client, when the user scans the QR code, then the client connects to the server it names.

## Server and versioning

REQ-020: The user can run the server on their own machine from a ready Docker image.
AC-53: Given the provided `docker-compose.yml` with two services, the server and Postgres, when the user runs `docker compose up -d`, then the server starts.
AC-54: Given Coolify, when the user deploys the same compose file, then the server starts.
AC-55: Given a running server, when a browser opens the web client from it, then the server serves the web client.
AC-56: Given a running server and a newer image, when the user runs `docker compose pull && docker compose up -d`, then the server is updated and database migrations run on start without a manual step.

REQ-021: Clients and servers of different versions work together.
AC-57: Given a running server, when a client calls `GET /health`, then the response holds the API version and a list of capabilities.
AC-58: Given a server that lists a capability, when the client reads the list, then it turns the matching feature on without comparing version numbers.
AC-59: Given a client built for an earlier release of the same major API version, when it talks to a later server, then no field it uses has been removed or renamed.
AC-60: Given a server that is too old for the client, when the client connects, then it says the server needs an update and lets the user continue with limited features.
AC-61: Given something that is being deprecated, when it is first deprecated, then the user is warned and not yet blocked.

## Bots and MCP

REQ-022: Bots can work with notes through MCP.
AC-62: Given a bot connected to `/mcp`, when it searches, then it gets matching notes.
AC-63: Given a bot connected to `/mcp`, when it reads a note, then it gets that note.
AC-64: Given a bot connected to `/mcp`, when it adds a note, then the note is created.
AC-65: Given a note created through MCP, when it is shown in a list, then the list shows the name of the bot that added it.

REQ-023: Bots connect with their own token.
AC-66: Given Settings, when the user opens "WAW Bot access", then the MCP URL is shown.
AC-67: Given "WAW Bot access" in Settings, when the user creates a bot token, then a token for bots is made that is separate from the other access tokens.

## WAW Tasks

REQ-024: The user can connect WAW Tasks to the Notes server.
AC-68: Given a token created in WAW Tasks under Settings, "WAW Bot access", when the user enters it with the WAW Tasks server URL in Notes Settings, then WAW Tasks is connected without being asked for again.
AC-69: Given a connected WAW Tasks server, when a client uses a task feature, then the Notes server talks to the Tasks server and the client does not.

REQ-025: The user can send any checklist item to WAW Tasks.
AC-70: Given a checklist item and a connected WAW Tasks, when the user sends it, then the same quick add as in WAW Tasks opens with the item text.
AC-71: Given the quick add, when the user types a date, priority or project in natural language, then it is highlighted inline and shown in an "Understood as" row.
AC-72: Given the quick add, when the user creates the task, then the item stays in the note and shows a chip such as "In WAW Tasks · Fri".
AC-73: Given a task created from a note, when the user views it in WAW Tasks, then it shows "From a note" and links back to the note.

REQ-026: A linked checklist item and its task keep the same done state.
AC-74: Given a linked item, when its done state changes in the note, then the task's done state changes to match.
AC-75: Given a linked item, when its task's done state changes in WAW Tasks, then the item's done state changes to match.
AC-76: Given a linked item, when the title of the item or of the task is changed, then the other title stays as it was.
AC-77: Given a change made in WAW Tasks, when the Notes server picks it up, then it does so by reading the change log with `GET /sync?after=`, with no webhook.

REQ-027: The user can see and manage the task linked to a checklist item.
AC-78: Given a linked item, when the user opens its chip, then the task's due date, project and status are shown, with the actions open in WAW Tasks, mark as done and unlink.
AC-79: Given a linked item, when the user unlinks it, then both the item and the task are kept and stop syncing.
AC-80: Given a note on desktop with linked tasks, when the user views the note info panel, then it lists those tasks.

## Import and export

REQ-028: The user can export all notes as Markdown.
AC-81: Given stored notes, when the user chooses "Export all notes as Markdown", then the notes are produced as `.md` files.

REQ-029: The user can import Markdown files, from Obsidian or any folder of `.md` files.
AC-82: Given a folder of `.md` files, when the user imports it, then the files become notes.
AC-83: Given a zip of `.md` files, when the user imports it, then the files become notes.
AC-84: Given imported files arranged in folders, when the import finishes, then each folder is a notebook.
AC-85: Given an imported file containing `[[links]]`, when the import finishes, then the note keeps those links.
AC-86: Given an imported file containing `#tags`, when the import finishes, then the note keeps those tags.

## Clients

REQ-030: v1 has an iOS app, a web client and an Electron desktop app.
AC-87: Given a running server, when the user connects from the iOS app, then the user can work with their notes.
AC-88: Given a running server, when the user connects from the web client, then the user can work with their notes.
AC-89: Given a running server, when the user connects from the Electron desktop app, then the user can work with their notes.

## Out of scope

REQ-031: v1 does not provide plugins, themes, custom CSS or editor settings.

REQ-032: v1 does not provide databases, boards, calendars or any other typed views of notes.

REQ-033: v1 does not provide nested notebooks or nested pages.

REQ-034: v1 does not provide a graph view of links.

REQ-035: v1 does not provide daily notes.

REQ-036: v1 does not provide reminders or push notifications.

REQ-037: v1 does not provide sharing, collaboration, comments or multiple users on one server.

REQ-038: v1 does not provide a hosted cloud version.
