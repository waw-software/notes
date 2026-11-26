// The capture command behind scripts/visual.sh.
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import {
	collectShots,
	copyMockups,
	prepareOutDir,
	writeReport,
} from "./assemble.ts";
import { changedFiles, resolveBase } from "./changes.ts";
import { captureIos } from "./ios.ts";
import {
	loadManifest,
	type ScreenEntry,
	shotName,
	type Target,
} from "./manifest.ts";
import type { Shot } from "./report.ts";
import { type Selection, selectScreens, UnknownScreenError } from "./select.ts";

const USAGE = `usage: scripts/visual.sh [--all] [--ios] [--out <dir>] [<screen-id>...]

Captures screens at 390 px, 1440 px and in the Electron window, next to their mockups.
Without ids or --all, the screens that the change against the base touches.

  --all        every screen
  --ios        also capture on the iOS simulator (macOS only)
  --out <dir>  output directory (default: apps/e2e/visual-results)
  --help       this text`;

const PLAYWRIGHT_TARGETS: Target[] = ["web-390", "web-1440", "electron"];

type Args = {
	all: boolean;
	ios: boolean;
	help: boolean;
	out: string | null;
	names: string[];
};

function parseArgs(argv: string[]): Args | null {
	const args: Args = {
		all: false,
		ios: false,
		help: false,
		out: null,
		names: [],
	};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i] as string;
		if (arg === "--all") {
			args.all = true;
		} else if (arg === "--ios") {
			args.ios = true;
		} else if (arg === "--help") {
			args.help = true;
		} else if (arg === "--out") {
			const value = argv[++i];
			if (!value || value.startsWith("--")) {
				return null;
			}
			args.out = resolve(process.cwd(), value);
		} else if (arg.startsWith("--")) {
			return null;
		} else {
			args.names.push(arg);
		}
	}
	return args;
}

/** Runs a command with its output on the terminal; returns its exit code. */
function execute(
	repoRoot: string,
	[command, ...args]: [string, ...string[]],
	env: NodeJS.ProcessEnv = process.env,
): number {
	const result = spawnSync(command, args, {
		cwd: repoRoot,
		stdio: "inherit",
		env,
	});
	if (result.error) {
		console.error(`${command}: ${result.error.message}`);
	}
	// A command that did not start or was killed has no status.
	return result.status ?? 1;
}

/** Builds and runs Playwright; returns why each target without a shot failed. */
function captureWithPlaywright(
	repoRoot: string,
	outDir: string,
	screens: ScreenEntry[],
): Partial<Record<Target, string>> {
	const failAll = (message: string) =>
		Object.fromEntries(PLAYWRIGHT_TARGETS.map((target) => [target, message]));
	const build = execute(repoRoot, ["scripts/project/e2e.sh", "build"]);
	if (build !== 0) {
		return failAll(`build failed (exit ${build})`);
	}
	const command: [string, ...string[]] = [
		"scripts/project/pnpm.sh",
		"--filter",
		"@waw-notes/e2e",
		"exec",
		"playwright",
		"test",
		"--project",
		"visual-390",
		"--project",
		"visual-1440",
		"--project",
		"visual-electron",
	];
	const headless = process.platform === "linux" && !process.env.DISPLAY;
	const code = execute(
		repoRoot,
		headless ? ["xvfb-run", "-a", ...command] : command,
		{
			...process.env,
			VISUAL_SCREENS: screens.map((screen) => screen.id).join(","),
			VISUAL_OUT: outDir,
		},
	);
	return code === 0
		? {}
		: failAll(`Playwright exited with code ${code}; see its output above`);
}

async function captureOnIos(
	repoRoot: string,
	outDir: string,
	screens: ScreenEntry[],
): Promise<Shot[]> {
	try {
		return await captureIos(screens, outDir, repoRoot);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		// A shot that the failed run left behind is not a result.
		return collectShots(outDir, screens, ["ios"], {}).map((shot) => ({
			...shot,
			actual: null,
			error: message,
		}));
	}
}

async function main(argv: string[]): Promise<number> {
	const args = parseArgs(argv);
	if (args === null) {
		console.error(USAGE);
		return 2;
	}
	if (args.help) {
		console.log(USAGE);
		return 0;
	}
	const repoRoot = resolve(import.meta.dirname, "../../..");
	const manifest = loadManifest(repoRoot);
	const needsChanges = args.names.length === 0 && !args.all;
	let selection: Selection;
	try {
		selection = selectScreens(manifest, {
			all: args.all,
			names: args.names,
			changedFiles: needsChanges
				? changedFiles(repoRoot, resolveBase(repoRoot))
				: [],
		});
	} catch (error) {
		if (error instanceof UnknownScreenError) {
			console.error(error.message);
			return 2;
		}
		throw error;
	}
	const { screens, reason } = selection;
	console.log(reason);
	if (screens.length === 0) {
		return 0;
	}
	if (args.ios && process.platform !== "darwin") {
		console.error("--ios needs macOS");
		return 2;
	}
	const outDir = args.out ?? join(repoRoot, "apps/e2e/visual-results");
	const targets: Target[] = args.ios
		? [...PLAYWRIGHT_TARGETS, "ios"]
		: PLAYWRIGHT_TARGETS;
	prepareOutDir(outDir, screens, targets);
	copyMockups(repoRoot, outDir, screens, targets);

	const failures = captureWithPlaywright(repoRoot, outDir, screens);
	const iosShots = args.ios
		? await captureOnIos(repoRoot, outDir, screens)
		: [];
	const shots = [
		...collectShots(outDir, screens, PLAYWRIGHT_TARGETS, failures),
		...iosShots,
	];
	const report = writeReport(outDir, screens, shots, new Date().toISOString());
	console.log(`report: ${report}`);
	const failed = shots.filter((shot) => shot.error !== null);
	for (const shot of failed) {
		console.error(
			`failed: ${shotName(shot.screenId, shot.target, "actual")}: ${shot.error}`,
		);
	}
	return failed.length > 0 ? 1 : 0;
}

process.exitCode = await main(process.argv.slice(2));
