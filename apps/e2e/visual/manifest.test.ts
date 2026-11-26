import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	desktopHeight,
	loadManifest,
	mockupPath,
	parseManifest,
	type ScreenEntry,
	shotName,
} from "./manifest.ts";

const entry: ScreenEntry = {
	id: "notebook",
	title: "Notebook",
	path: "/notebook",
	sources: ["apps/client/src/notebook"],
	mobile: { mockup: "First run, no notes.png" },
	desktop: { mockup: "Notebook, list and editor.png" },
};

const manifestOf = (...screens: unknown[]) => ({ global: [], screens });

const tempDirs: string[] = [];

afterEach(() => {
	for (const dir of tempDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

function tempRepo(manifest: unknown): string {
	const root = mkdtempSync(join(tmpdir(), "visual-manifest-"));
	tempDirs.push(root);
	mkdirSync(join(root, "apps/e2e/visual"), { recursive: true });
	writeFileSync(
		join(root, "apps/e2e/visual/screens.json"),
		JSON.stringify(manifest),
	);
	return root;
}

describe("parseManifest", () => {
	it("rejects a duplicate id", () => {
		expect(() => parseManifest(manifestOf(entry, entry))).toThrow(
			/duplicate.*notebook/,
		);
	});

	it("rejects a path without a leading slash", () => {
		expect(() =>
			parseManifest(manifestOf({ ...entry, path: "notebook" })),
		).toThrow(/notebook.*path/);
	});

	it("rejects empty sources", () => {
		expect(() => parseManifest(manifestOf({ ...entry, sources: [] }))).toThrow(
			/notebook.*sources/,
		);
	});

	it("rejects a mockup that is not a .png name", () => {
		expect(() =>
			parseManifest(manifestOf({ ...entry, mobile: { mockup: "Notes.jpg" } })),
		).toThrow(/notebook.*mockup/);
	});

	it("rejects a non-positive desktop height", () => {
		expect(() =>
			parseManifest(
				manifestOf({ ...entry, desktop: { mockup: null, height: 0 } }),
			),
		).toThrow(/notebook.*height/);
	});

	it.each([
		["a value that is not an object", null, /not an object/],
		["a global that is not an array", { global: "a", screens: [] }, /global/],
		["screens that are not an array", { global: [], screens: {} }, /screens/],
		[
			"an id with other characters",
			manifestOf({ ...entry, id: "Note Book" }),
			/id.*Note Book/,
		],
	])("rejects %s", (_name, json, message) => {
		expect(() => parseManifest(json)).toThrow(message);
	});
});

describe("mockupPath", () => {
	it("maps web-390 and ios to the mobile mockup and web-1440 and electron to the desktop one", () => {
		expect(mockupPath(entry, "web-390")).toBe(
			"docs/design/screens/mobile/First run, no notes.png",
		);
		expect(mockupPath(entry, "ios")).toBe(
			"docs/design/screens/mobile/First run, no notes.png",
		);
		expect(mockupPath(entry, "web-1440")).toBe(
			"docs/design/screens/desktop/Notebook, list and editor.png",
		);
		expect(mockupPath(entry, "electron")).toBe(
			"docs/design/screens/desktop/Notebook, list and editor.png",
		);
	});

	it("returns null for a null mockup", () => {
		const bare = {
			...entry,
			mobile: { mockup: null },
			desktop: { mockup: null },
		};
		expect(mockupPath(bare, "web-390")).toBeNull();
		expect(mockupPath(bare, "electron")).toBeNull();
	});
});

describe("desktopHeight and shotName", () => {
	it("desktopHeight defaults to 900", () => {
		expect(desktopHeight(entry)).toBe(900);
		expect(
			desktopHeight({ ...entry, desktop: { mockup: null, height: 1080 } }),
		).toBe(1080);
	});

	it("shotName builds id.target.kind.png", () => {
		expect(shotName("shell", "web-1440", "mockup")).toBe(
			"shell.web-1440.mockup.png",
		);
	});
});

describe("loadManifest", () => {
	it("loadManifest fails on a mockup file that does not exist", () => {
		const root = tempRepo(manifestOf(entry));
		expect(() => loadManifest(root)).toThrow(
			/apps\/e2e\/visual\/screens\.json.*First run, no notes\.png/,
		);
	});

	it("loadManifest accepts an existing mockup", () => {
		const withMockup = {
			...entry,
			mobile: { mockup: "Notes.png" },
			desktop: { mockup: null },
		};
		const root = tempRepo(manifestOf(withMockup));
		mkdirSync(join(root, "docs/design/screens/mobile"), { recursive: true });
		writeFileSync(
			join(root, "docs/design/screens/mobile/Notes.png"),
			new Uint8Array(1),
		);
		expect(loadManifest(root).screens).toEqual([withMockup]);
	});

	it("the committed screens.json loads", () => {
		const root = resolve(import.meta.dirname, "../../..");
		expect(loadManifest(root).screens.map((screen) => screen.id)).toContain(
			"shell",
		);
	});
});
