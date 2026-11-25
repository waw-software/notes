# WAW Notes: design reference

This file is the source of truth for how the app looks. `SPEC.md` is the source of truth for how it behaves.

The screens were drawn as HTML mockups. Their sources are in `docs/design/mobile/` and `docs/design/desktop/`. PNG exports, when present, are in `docs/design/screens/`. How to read the sources is explained in `docs/design/README.md`.

Use the mockups for layout, spacing, colour, copy and states. Do not copy their markup: they are inline-styled HTML with sample data, not components.

WAW Notes shares its tokens with WAW Tasks and WAW Bot. If you already built the theme for one of them, reuse it.

## 1. Character

- Minimal but not empty. White background, one accent colour, few borders. Every screen still tells the user something.
- The note is the interface. Chrome stays quiet so the text is the darkest, largest thing on screen.
- Nothing to configure. No screen offers a choice of theme, font or layout.
- Colour carries meaning, never decoration: red accent for the primary action and for links, green for synced, amber for waiting to sync.
- All UI copy is in English.

## 2. Tokens

Put these in one theme module and use only the names in components.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#FFFFFF` | Screen background, the note |
| `surface` | `#F6F5F2` | Sidebar, cards, icon squares, selected row, chips |
| `ink` | `#171717` | Primary text, checked checkbox, selected filter chip |
| `ink-2` | `#3D3D3D` | Snippets, secondary body text |
| `muted` | `#5C5C5C` | Meta text, counts, inactive tabs, group labels |
| `border` | `#E4E2DD` | Card borders |
| `border-strong` | `#D9D6D0` | Input borders, outline buttons |
| `divider` | `#EEECE8` | Row dividers |
| `accent` | `#D4213D` | Primary button, add button, logo, caret, quote bar |
| `accent-text` | `#B01A31` | Links, text buttons, active tab |
| `accent-dark` | `#8C1427` | Hover, text on accent tint |
| `accent-tint` | `#FCEBEE` | WAW Tasks chip, pending `[[` link |
| `success` | `#1F7A4D` | Synced dot |
| `success-text` | `#1B6943` | Success text |
| `success-tint` | `#EEF6F1` | Success line |
| `warning` | `#8A5A00` | "not synced yet", offline dot. Use `#7A4F00` on a tint |
| `warning-tint` | `#FBF3E2` | Offline banner, search match highlight |

Keep text and background pairs together: `accent-text` on white, `accent-dark` on `accent-tint`, `#7A4F00` on `warning-tint`.

### Type

- Interface and note body: Inter 400, 500, 600.
- Headings, note titles and the wordmark: Space Grotesk 600.
- Code, tokens, URLs, keyboard hints: the system monospace stack.

| Role | Mobile | Desktop |
| --- | --- | --- |
| Screen title | 30 px | 30 px |
| Note title | 28 px, line 34 | 36 px, line 44 |
| Heading inside a note | 20 px, line 26 | 22 px, line 28 |
| Note body | 16 px, line 26 | 16 px, line 27 |
| List row title | 16 px, 500 | 15 px, 600 |
| Snippet | 14 px, line 20 | 13 px, line 19 |
| Meta | 13 px | 12 to 13 px |
| Group label | 12 px, 600, uppercase, letter spacing 0.4 px | same |
| Tab label | 11 px | none |

### Shape and size

- Radius: 6 for chips and highlights, 10 for nav rows, 12 for inputs, small buttons and icon squares, 14 for cards and primary buttons, 18 to 20 for sheets and dialogs, 999 for filter pills.
- Every tappable target is at least 44 px high. Desktop checklist rows are 40 px.
- Mobile: inputs 52 px, primary button 54 px, add button 56 px, tab item 52 px. Reference frame 390 x 844.
- Desktop: sidebar 248 px, note list 320 to 380 px, note info panel 300 to 340 px, note column at most 680 px wide and centred. Reference width 1440.

## 3. Inside a note

- **Link to a note.** `accent-text`, weight 500, underlined with a 3 px offset. While it is being typed (`[[bud`) it sits on `accent-tint` in `accent-dark`.
- **Tag.** Chip on `surface`, text `ink-2`, weight 500, padding 2 x 8, radius 6.
- **Checklist item.** 22 px checkbox (20 on desktop) in a 44 px target. Checked: box filled `ink`, text `muted` and struck through.
- **WAW Tasks chip.** After a linked item: `accent-dark` on `accent-tint`, 13 px, weight 500, for example "In WAW Tasks · Fri". It is a link.
- **Quote.** 3 px `accent` bar on the left, text `ink-2`.
- **Typed trigger.** A typed `/` sits on `surface` until a block is chosen. The caret is 2 px wide in `accent`.
- **Linked from.** A `surface` card under the note: group label with a count, then one row per linking note with its notebook on the right.

## 4. Components

- **Note row.** Title, one-line snippet (two lines on desktop), meta line. The meta line holds the notebook emoji and name, the time, and when present "added by Noter in WAW Bot" or "not synced yet" in the warning colour.
- **Pinned card.** `surface` card with notebook, title and a short snippet. Two per row on mobile.
- **Notebook row.** A 40 px `surface` square with the emoji, the name, a meta line and a chevron. With no emoji the square shows the default notebook icon in `muted`.
- **Icon picker.** The current icon large on top, a grid of emoji buttons (the picked one has a 2 px `ink` ring), and "Use the default icon".
- **Tab bar** (mobile): Notes, Notebooks, Search. The add button floats above it on list screens.
- **Formatting toolbar** (mobile, in a note): text style, bold, bulleted list, checklist, link to note, and an accent button that opens the block menu.
- **Sheet** (mobile): slides up over the note with a grabber, a title and a close button. Used for the block menu, the note picker and both WAW Tasks sheets. It does not dim the note.
- **Block menu.** Mobile: two-column grid of ten buttons. Desktop: a 320 px popover list with the Markdown shortcut on the right of each row.
- **Sidebar** (desktop): wordmark, "New note", a search field that opens the quick switcher, All notes and Pinned with counts, notebooks with emoji and counts, tags, server status.
- **Note info panel** (desktop): Outline, Linked from, Links to, Tasks, Details, "Export as Markdown".
- **Quick switcher** (desktop): centred dialog over a dimmed window. Field, Notes results, Actions, a hint row.
- **Banner.** A tinted strip with an action on the right: offline (`warning-tint`), server needs an update (`surface`).
- **Success line.** `success-tint` strip with a green dot, for "Server reachable" and "Connected".
- **Settings group.** Uppercase label, a bordered card of rows, an optional hint line under it.
- **Buttons.** Primary (accent fill), secondary (outline), text (accent text), filter pill.
- **Text input** with its label above.

### Icons and emoji

Interface icons are stroke icons, 1.9 to 2.2 px, in the current text colour.

Emoji appear in one place only: as the icon a user picks for a notebook. Wherever the notebook is named (rows, breadcrumbs, note meta, search chips) its emoji goes with it. Never use emoji for interface icons.

## 5. Screens

### Mobile (`docs/design/mobile/`)

| File | Screen | Notes |
| --- | --- | --- |
| `Main.dc.html` | Notes | Pinned cards, recent notes, add button, tab bar |
| `Empty.dc.html` | First run, no notes | First-note button, make a notebook, import, three typing tips |
| `Offline.dc.html` | Working offline | Banner with Retry, rows marked "not synced yet" |
| `Notebooks.dc.html` | Notebooks | Notebook rows, tags with counts, server status and Settings |
| `Notebook.dc.html` | Inside a notebook | Icon and name header, notes, edit and sort actions |
| `NewNotebook.dc.html` | Notebook name and icon | Interactive mockup: picking an emoji updates the preview |
| `Note.dc.html` | Note | Title, tags, body, checklist with a WAW Tasks chip, Linked from, toolbar |
| `Insert.dc.html` | Insert a block | `/` typed, sheet with the ten blocks |
| `LinkNote.dc.html` | Link to a note | `[[bud` typed, sheet with matches and "Create note" |
| `Search.dc.html` | Search | Field, filter pills, results with highlighted matches |
| `Connect.dc.html` | Connect | Server URL, token, connection check, scan QR |
| `Settings.dc.html` | Settings | Server, WAW Tasks, WAW Bot access, export and import |
| `ConnectTasks.dc.html` | Connect WAW Tasks | Tasks server URL, token, result, what is shared |
| `SendToTasks.dc.html` | Send an item to WAW Tasks | Sheet with quick add, highlights, "Understood as" |
| `TaskLinked.dc.html` | An item linked to a task | Sheet with due, project, status and the three actions |
| `TaskInTasks.dc.html` | The task in WAW Tasks | A WAW Tasks screen, shown for reference: the "From a note" block |

### Desktop (`docs/design/desktop/`)

| File | Screen | Covers these mobile screens |
| --- | --- | --- |
| `Desktop.dc.html` | Sidebar, note list and editor | Notes, Notebooks, Inside a notebook, Note |
| `DesktopEditor.dc.html` | Editor with the slash menu and note info | Insert a block, plus the note info panel |
| `DesktopSwitcher.dc.html` | Quick switcher | Link to a note, Search |
| `DesktopTasks.dc.html` | Sending an item to WAW Tasks | Send an item, An item linked to a task |
| `DesktopSettings.dc.html` | Settings | Settings, Connect WAW Tasks, plus desktop app options and "pair a phone" |
| `DesktopConnect.dc.html` | Connect with deploy steps | Connect |
| `DesktopStates.dc.html` | Offline list, update banner, empty editor | Working offline, First run |

`DesktopEditor` is drawn 1080 px tall so the open menu fits. The others are 900.

## 6. Responsive rules

- Under about 700 px wide: the mobile layout with the tab bar.
- From about 700 to 1100 px: sidebar plus one pane. The note list and the note replace each other; the info panel opens over the note.
- Above about 1100 px: sidebar, note list and note. The info panel takes the place of the note list when it is open, as in `DesktopEditor`.

These breakpoints are a proposal. The web client must work at every width; Electron opens at the three-pane layout.

## 7. Desktop specifics

- Ctrl or Cmd + K opens the quick switcher from anywhere in the app.
- Settings has a "Desktop app" group: open at login, keep running in the menu bar or tray, quick note shortcut. The mockup shows Ctrl or Cmd + Shift + N; the combination is not final.
- "Send to WAW Tasks" appears on a checklist row on hover or focus and opens a popover under the row. Enter creates the task.
- Hover exists on desktop only. Use `surface` as the hover fill for rows.

## 8. Accessibility

- Keep the text and background pairs from section 2.
- Never show state by colour alone: sync state has words, the WAW Tasks chip has text, the active tab is also bolder.
- Every control has a visible label or an accessible name. Decorative icons and notebook emoji are hidden from screen readers; the notebook name is always there in text.
- Minimum target 44 px.
- The editor must be fully usable from the keyboard on desktop, including the slash menu and the note picker.

## 9. Known gaps in the mockups

Follow this file and `SPEC.md` where the mockups disagree with them.

- There is no mockup for how a table, an image or a code block looks inside a note, nor for the text style menu behind "Aa". Design them from the tokens here and flag them for review.
- There are no mockups for: creating a notebook on desktop, the Pinned view, the sort menu, delete confirmations, a conflicted copy, the import and export flows, loading states, dark mode.
- Mobile has no "scan QR" and no "server needs an update" screen. Reuse the ones from WAW Tasks.
- `TaskInTasks` belongs to WAW Tasks. It is here to show the other side of the integration.
- On mobile, "Send to WAW Tasks" opens from the item's "⋯" button; the mockup shows the sheet already open.
- Sample data (note names, dates, counts) is illustrative.
