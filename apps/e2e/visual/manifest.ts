import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Target = "web-390" | "web-1440" | "electron" | "ios";

export const TARGETS: readonly Target[] = [
	"web-390",
	"web-1440",
	"electron",
	"ios",
];

export type ScreenEntry = {
	id: string;
	title: string;
	path: string;
	sources: string[];
	mobile: { mockup: string | null };
	desktop: { mockup: string | null; height?: number };
};

export type Manifest = { global: string[]; screens: ScreenEntry[] };

export const MANIFEST_PATH = "apps/e2e/visual/screens.json";
export const MOBILE_DIR = "docs/design/screens/mobile";
export const DESKTOP_DIR = "docs/design/screens/desktop";

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown): value is string[] {
	return (
		Array.isArray(value) &&
		value.every((item) => typeof item === "string" && item !== "")
	);
}

function parseMockup(side: unknown, id: string, name: string): string | null {
	const mockup = isObject(side) ? side.mockup : undefined;
	if (
		mockup === null ||
		(typeof mockup === "string" && mockup.endsWith(".png"))
	) {
		return mockup;
	}
	throw new Error(`screen ${id}: ${name}.mockup must be null or a .png name`);
}

function parseScreen(value: unknown): ScreenEntry {
	if (!isObject(value)) {
		throw new Error("a screen is not an object");
	}
	const { id, title, path, sources, mobile, desktop } = value;
	if (typeof id !== "string" || !/^[a-z0-9-]+$/.test(id)) {
		throw new Error(`screen id must match [a-z0-9-]+: ${String(id)}`);
	}
	if (typeof title !== "string") {
		throw new Error(`screen ${id}: title must be a string`);
	}
	if (typeof path !== "string" || !path.startsWith("/")) {
		throw new Error(`screen ${id}: path must start with "/"`);
	}
	if (!isStringList(sources) || sources.length === 0) {
		throw new Error(`screen ${id}: sources must be a non-empty list of paths`);
	}
	const entry: ScreenEntry = {
		id,
		title,
		path,
		sources,
		mobile: { mockup: parseMockup(mobile, id, "mobile") },
		desktop: { mockup: parseMockup(desktop, id, "desktop") },
	};
	const height = isObject(desktop) ? desktop.height : undefined;
	if (height !== undefined) {
		if (
			typeof height !== "number" ||
			!Number.isInteger(height) ||
			height <= 0
		) {
			throw new Error(
				`screen ${id}: desktop.height must be a positive integer`,
			);
		}
		entry.desktop.height = height;
	}
	return entry;
}

export function parseManifest(json: unknown): Manifest {
	if (!isObject(json)) {
		throw new Error("the manifest is not an object");
	}
	const { global, screens } = json;
	if (!isStringList(global)) {
		throw new Error("`global` must be a list of paths");
	}
	if (!Array.isArray(screens)) {
		throw new Error("`screens` must be a list");
	}
	const ids = new Set<string>();
	const entries = screens.map((value: unknown) => {
		const entry = parseScreen(value);
		if (ids.has(entry.id)) {
			throw new Error(`duplicate screen id: ${entry.id}`);
		}
		ids.add(entry.id);
		return entry;
	});
	return { global, screens: entries };
}

export function mockupPath(entry: ScreenEntry, target: Target): string | null {
	const mobile = target === "web-390" || target === "ios";
	const { mockup } = mobile ? entry.mobile : entry.desktop;
	return mockup === null
		? null
		: `${mobile ? MOBILE_DIR : DESKTOP_DIR}/${mockup}`;
}

export function desktopHeight(entry: ScreenEntry): number {
	return entry.desktop.height ?? 900;
}

export function loadManifest(repoRoot: string): Manifest {
	const file = join(repoRoot, MANIFEST_PATH);
	const manifest = parseManifest(JSON.parse(readFileSync(file, "utf8")));
	for (const entry of manifest.screens) {
		for (const target of ["web-390", "web-1440"] as const) {
			const mockup = mockupPath(entry, target);
			if (mockup !== null && !existsSync(join(repoRoot, mockup))) {
				throw new Error(`${MANIFEST_PATH}: mockup does not exist: ${mockup}`);
			}
		}
	}
	return manifest;
}

export function shotName(
	id: string,
	target: Target,
	kind: "actual" | "mockup",
): string {
	return `${id}.${target}.${kind}.png`;
}
