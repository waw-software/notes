export { theme } from "@waw/design-tokens";

// Notes-only tokens (docs/DESIGN.md section 2); the shared ones come from `theme`.
export const notesTheme = {
	color: { "warning-on-tint": "#7A4F00" },
	type: {
		noteTitle: {
			mobile: { size: 28, line: 34 },
			desktop: { size: 36, line: 44 },
		},
		noteHeading: {
			mobile: { size: 20, line: 26 },
			desktop: { size: 22, line: 28 },
		},
		noteBody: {
			mobile: { size: 16, line: 26 },
			desktop: { size: 16, line: 27 },
		},
		rowTitle: {
			mobile: { size: 16, weight: "500" },
			desktop: { size: 15, weight: "600" },
		},
		snippet: {
			mobile: { size: 14, line: 20 },
			desktop: { size: 13, line: 19 },
		},
		metaDesktop: 12,
	},
	radius: { sheet: 20, dialog: 18, iconSquare: 12 },
	size: {
		mobileInput: 52,
		notebookIcon: 40,
		desktopChecklistRow: 40,
		desktopCheckbox: 20,
		noteListMin: 320,
		noteListMax: 380,
		infoPanelMin: 300,
		infoPanelMax: 340,
		noteColumnMax: 680,
		popover: 320,
		sidebarFrom: 700,
		threePaneFrom: 1100,
		grabberWidth: 36,
		grabberHeight: 4,
	},
	overlay: {
		scrim: "rgba(23,23,23,0.32)", // docs/design/desktop/DesktopSwitcher.dc.html
		dialogShadow: "0 24px 60px rgba(23,23,23,0.25)", // docs/design/desktop/DesktopSwitcher.dc.html
		sheetShadow: "0 -10px 30px rgba(23,23,23,0.12)", // docs/design/mobile/LinkNote.dc.html
		popoverShadow: "0 12px 32px rgba(23,23,23,0.14)", // docs/design/desktop/DesktopEditor.dc.html
	},
} as const;
