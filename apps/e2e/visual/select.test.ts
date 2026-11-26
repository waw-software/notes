import { describe, expect, it } from "vitest";
import type { Manifest } from "./manifest.ts";
import { selectScreens, UnknownScreenError } from "./select.ts";

const manifest: Manifest = {
	global: ["apps/client/App.tsx", "apps/client/src/theme/"],
	screens: [
		{
			id: "notes",
			title: "Notes",
			path: "/notes",
			sources: ["apps/client/src/notes"],
			mobile: { mockup: "Notes.png" },
			desktop: { mockup: "Notebook, list and editor.png" },
		},
		{
			id: "search",
			title: "Search",
			path: "/search",
			sources: ["apps/client/src/Search.tsx"],
			mobile: { mockup: "Search.png" },
			desktop: { mockup: null },
		},
		{
			id: "settings",
			title: "Settings",
			path: "/settings",
			sources: ["apps/client/src/Settings.tsx"],
			mobile: { mockup: null },
			desktop: { mockup: "Settings.png" },
		},
	],
};

function select(o: { all?: boolean; names?: string[]; changed?: string[] }) {
	const selection = selectScreens(manifest, {
		all: o.all ?? false,
		names: o.names ?? [],
		changedFiles: o.changed ?? [],
	});
	return {
		ids: selection.screens.map((screen) => screen.id),
		reason: selection.reason,
	};
}

describe("selectScreens", () => {
	it("explicit names select those screens in manifest order", () => {
		expect(
			select({
				all: true,
				names: ["settings", "notes"],
				changed: ["apps/client/App.tsx"],
			}),
		).toEqual({
			ids: ["notes", "settings"],
			reason: "named: notes, settings",
		});
	});

	it("an unknown name throws UnknownScreenError naming it", () => {
		const run = () => select({ names: ["notes", "nope", "gone"] });
		expect(run).toThrow(UnknownScreenError);
		expect(run).toThrow(/^unknown screen: nope, gone$/);
	});

	it("all selects every screen", () => {
		expect(select({ all: true })).toEqual({
			ids: ["notes", "search", "settings"],
			reason: "all screens",
		});
	});

	it("a changed source file selects its screen", () => {
		expect(
			select({
				changed: ["apps/client/src/Settings.tsx", "apps/client/src/Search.tsx"],
			}),
		).toEqual({
			ids: ["search", "settings"],
			reason:
				"changed: apps/client/src/Search.tsx → search; apps/client/src/Settings.tsx → settings",
		});
	});

	it("a file under a source directory selects it", () => {
		expect(select({ changed: ["apps/client/src/notes/List.tsx"] }).ids).toEqual(
			["notes"],
		);
	});

	it("a file whose name only starts like a source does not select it", () => {
		expect(select({ changed: ["apps/client/src/notes-old/x.ts"] }).ids).toEqual(
			[],
		);
	});

	it.each([
		["docs/design/screens/mobile/Search.png", "search"],
		["docs/design/screens/desktop/Settings.png", "settings"],
	])("a changed mockup PNG selects its screen: %s", (file, id) => {
		expect(select({ changed: [file] }).ids).toEqual([id]);
	});

	it.each(["apps/client/App.tsx", "apps/client/src/theme/colors.ts"])(
		"a changed global file selects all: %s",
		(file) => {
			expect(select({ changed: ["README.md", file] })).toEqual({
				ids: ["notes", "search", "settings"],
				reason: `global file changed: ${file}`,
			});
		},
	);

	it("only docs changes select none with reason 'no screen touched'", () => {
		expect(
			select({ changed: ["docs/SPEC.md", "docs/design/screens/README.md"] }),
		).toEqual({ ids: [], reason: "no screen touched" });
	});

	it("an empty change list selects none", () => {
		expect(select({})).toEqual({ ids: [], reason: "no screen touched" });
	});
});
