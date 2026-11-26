import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	collectShots,
	copyMockups,
	prepareOutDir,
	writeReport,
} from "./assemble.ts";
import type { ScreenEntry } from "./manifest.ts";

const screen: ScreenEntry = {
	id: "x",
	title: "X",
	path: "/",
	sources: ["apps/client/App.tsx"],
	mobile: { mockup: "Notes.png" },
	desktop: { mockup: null },
};

let repoRoot: string;
let outDir: string;

beforeEach(() => {
	repoRoot = mkdtempSync(join(tmpdir(), "visual-assemble-"));
	outDir = join(repoRoot, "out", "visual");
	const mobile = join(repoRoot, "docs/design/screens/mobile");
	mkdirSync(mobile, { recursive: true });
	writeFileSync(join(mobile, "Notes.png"), "mockup bytes");
});

afterEach(() => {
	rmSync(repoRoot, { recursive: true, force: true });
});

const out = (file: string) => join(outDir, file);

describe("assemble", () => {
	it("the mockup is copied next to its actual and the report row links both", () => {
		prepareOutDir(outDir, [screen], ["web-390"]);
		writeFileSync(out("x.web-390.actual.png"), "actual bytes");
		copyMockups(repoRoot, outDir, [screen], ["web-390"]);
		const shots = collectShots(outDir, [screen], ["web-390"], {});
		const report = writeReport(outDir, [screen], shots, "2026-11-26T10:00:00Z");

		expect(readFileSync(out("x.web-390.mockup.png"), "utf8")).toBe(
			"mockup bytes",
		);
		expect(shots).toEqual([
			{
				screenId: "x",
				target: "web-390",
				actual: "x.web-390.actual.png",
				mockup: "x.web-390.mockup.png",
				error: null,
			},
		]);
		expect(report).toBe(out("index.html"));
		const rows = readFileSync(report, "utf8")
			.split('<div class="pair">')
			.slice(1);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toContain('src="x.web-390.mockup.png"');
		expect(rows[0]).toContain('src="x.web-390.actual.png"');
	});

	it("a null mockup copies nothing", () => {
		prepareOutDir(outDir, [screen], ["web-1440", "electron"]);
		copyMockups(repoRoot, outDir, [screen], ["web-1440", "electron"]);

		expect(readdirSync(outDir)).toEqual([]);
		expect(
			collectShots(outDir, [screen], ["web-1440"], {})[0]?.mockup,
		).toBeNull();
	});

	it("a stale actual from an earlier run is not shown when this run failed", () => {
		mkdirSync(outDir, { recursive: true });
		writeFileSync(out("x.web-390.actual.png"), "from an earlier run");
		writeFileSync(out("x.web-390.mockup.png"), "from an earlier run");

		prepareOutDir(outDir, [screen], ["web-390"]);

		expect(existsSync(out("x.web-390.mockup.png"))).toBe(false);
		expect(
			collectShots(outDir, [screen], ["web-390"], { "web-390": "boom" }),
		).toEqual([
			{
				screenId: "x",
				target: "web-390",
				actual: null,
				mockup: null,
				error: "boom",
			},
		]);
	});

	it("a missing actual without a failure reads 'not captured'", () => {
		prepareOutDir(outDir, [screen], ["web-390", "electron"]);

		expect(
			collectShots(outDir, [screen], ["web-390", "electron"], {}).map(
				(shot) => [shot.target, shot.actual, shot.error],
			),
		).toEqual([
			["web-390", null, "not captured"],
			["electron", null, "not captured"],
		]);
	});

	it("prepareOutDir leaves files of screens that are not selected", () => {
		mkdirSync(outDir, { recursive: true });
		writeFileSync(out("other.web-390.actual.png"), "kept");
		writeFileSync(out("x.electron.actual.png"), "kept");
		writeFileSync(out("x.web-390.actual.png"), "removed");

		prepareOutDir(outDir, [screen], ["web-390"]);

		expect(readdirSync(outDir).sort()).toEqual([
			"other.web-390.actual.png",
			"x.electron.actual.png",
		]);
	});
});
