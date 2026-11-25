# Design sources

These folders hold the screen mockups for WAW Notes.

- `mobile/`: 16 phone screens, drawn at 390 x 844.
- `desktop/`: 7 desktop screens, drawn at 1440 wide. They stretch to fill the window.
- `canvas.json`: the index of the design canvas, for both folders.
- `screens/`: PNG exports of the same screens. Add them here; see below.

`../DESIGN.md` lists every screen, what it shows, and which desktop screen covers which mobile screens.

## How to read a `.dc.html` file

Each file is one screen. It is plain HTML with inline styles, plus a small template layer:

- Everything inside `<x-dc>` is the screen's markup. Read it for structure, spacing, colours, sizes and copy.
- `<helmet>` holds the fonts and a few global styles.
- `{{name}}` is a placeholder filled from the script at the bottom of the file.
- `<sc-for list="{{items}}" as="item">` repeats its content for each entry of a list.
- `<sc-if value="{{flag}}">` shows its content when the flag is true.
- The `<script type="text/x-dc">` block at the bottom returns the sample data for the placeholders: note lists, tabs, the ten blocks. It shows the shape of the data a screen needs.
- Links between screens (`href="Note.dc.html"`) show the navigation. On the canvas all screens sit in one folder, so a link names the file only; look for it in `mobile/` or `desktop/`.
- `canvas.json` records each screen's title, size and position on the canvas. Its `notes` are the group titles.

The files reference `./support.js`, the runtime of the design tool. It is not included, so the files do not render when opened in a browser. Read them as source. For the rendered look, use the PNGs.

## Using them

- Use the mockups for layout, spacing, colour, wording and states.
- Do not copy the markup. Build real components from the tokens in `../DESIGN.md`.
- The sample data is illustrative.
- What the mockups do not cover is listed in `../DESIGN.md` section 9.

## PNG exports

`screens/` is filled by hand: export each screen from the design canvas as PNG and save it as `screens/mobile/<Name>.png` or `screens/desktop/<Name>.png`, using the same name as the source file (for example `screens/mobile/Main.png`).
