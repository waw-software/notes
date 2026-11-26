import {
	copyFileSync,
	existsSync,
	mkdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import {
	mockupPath,
	type ScreenEntry,
	shotName,
	type Target,
} from "./manifest.ts";
import { renderReport, type Shot } from "./report.ts";

type Pair = { screen: ScreenEntry; target: Target };

function pairs(screens: ScreenEntry[], targets: Target[]): Pair[] {
	return screens.flatMap((screen) =>
		targets.map((target) => ({ screen, target })),
	);
}

/** Removes the selected shots, so that nothing from an earlier run shows as this run's result. */
export function prepareOutDir(
	outDir: string,
	screens: ScreenEntry[],
	targets: Target[],
): void {
	mkdirSync(outDir, { recursive: true });
	for (const { screen, target } of pairs(screens, targets)) {
		for (const kind of ["actual", "mockup"] as const) {
			rmSync(join(outDir, shotName(screen.id, target, kind)), { force: true });
		}
	}
}

export function copyMockups(
	repoRoot: string,
	outDir: string,
	screens: ScreenEntry[],
	targets: Target[],
): void {
	for (const { screen, target } of pairs(screens, targets)) {
		const source = mockupPath(screen, target);
		if (source !== null) {
			copyFileSync(
				join(repoRoot, source),
				join(outDir, shotName(screen.id, target, "mockup")),
			);
		}
	}
}

export function collectShots(
	outDir: string,
	screens: ScreenEntry[],
	targets: Target[],
	failures: Partial<Record<Target, string>>,
): Shot[] {
	const present = (file: string): string | null =>
		existsSync(join(outDir, file)) ? file : null;
	return pairs(screens, targets).map(({ screen, target }) => {
		const actual = present(shotName(screen.id, target, "actual"));
		return {
			screenId: screen.id,
			target,
			actual,
			mockup: present(shotName(screen.id, target, "mockup")),
			error: actual === null ? (failures[target] ?? "not captured") : null,
		};
	});
}

export function writeReport(
	outDir: string,
	screens: ScreenEntry[],
	shots: Shot[],
	generatedAt: string,
): string {
	const file = resolve(outDir, "index.html");
	writeFileSync(file, renderReport(screens, shots, generatedAt));
	return file;
}
