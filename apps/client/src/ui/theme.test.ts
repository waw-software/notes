import { notesTheme, theme } from "./theme";

describe("theme", () => {
	it("notes colours equal DESIGN.md section 2", () => {
		expect(theme.color).toMatchObject({
			bg: "#FFFFFF",
			surface: "#F6F5F2",
			ink: "#171717",
			"ink-2": "#3D3D3D",
			muted: "#5C5C5C",
			border: "#E4E2DD",
			"border-strong": "#D9D6D0",
			divider: "#EEECE8",
			accent: "#D4213D",
			"accent-text": "#B01A31",
			"accent-dark": "#8C1427",
			"accent-tint": "#FCEBEE",
			success: "#1F7A4D",
			"success-text": "#1B6943",
			"success-tint": "#EEF6F1",
			warning: "#8A5A00",
			"warning-tint": "#FBF3E2",
		});
	});

	it("warning text on a tint is #7A4F00", () => {
		expect(notesTheme.color["warning-on-tint"]).toBe("#7A4F00");
	});

	it("note text sizes follow DESIGN.md", () => {
		expect(notesTheme.type.noteTitle).toEqual({
			mobile: { size: 28, line: 34 },
			desktop: { size: 36, line: 44 },
		});
		expect(notesTheme.type.noteHeading).toEqual({
			mobile: { size: 20, line: 26 },
			desktop: { size: 22, line: 28 },
		});
		expect(notesTheme.type.noteBody).toEqual({
			mobile: { size: 16, line: 26 },
			desktop: { size: 16, line: 27 },
		});
		expect(notesTheme.type.snippet).toEqual({
			mobile: { size: 14, line: 20 },
			desktop: { size: 13, line: 19 },
		});
		expect(notesTheme.type.metaDesktop).toBe(12);
	});

	it("row titles are 16/500 on mobile and 15/600 on desktop", () => {
		expect(notesTheme.type.rowTitle).toEqual({
			mobile: { size: 16, weight: "500" },
			desktop: { size: 15, weight: "600" },
		});
	});

	it("shape and size follow DESIGN.md", () => {
		expect(notesTheme.radius).toMatchObject({ sheet: 20, dialog: 18 });
		expect(notesTheme.size).toMatchObject({
			mobileInput: 52,
			notebookIcon: 40,
			desktopChecklistRow: 40,
			desktopCheckbox: 20,
			noteColumnMax: 680,
			popover: 320,
			noteListMin: 320,
			noteListMax: 380,
			infoPanelMin: 300,
			infoPanelMax: 340,
			sidebarFrom: 700,
			threePaneFrom: 1100,
		});
	});
});
