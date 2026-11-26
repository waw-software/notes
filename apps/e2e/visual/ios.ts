import { execFile, spawn } from "node:child_process";
import {
	closeSync,
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	openSync,
	rmSync,
	statSync,
} from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify, stripVTControlCharacters } from "node:util";
import { mockupPath, type ScreenEntry, shotName } from "./manifest.ts";
import type { Shot } from "./report.ts";

export const DEFAULT_DEVICE = "iPhone 17e";
export const DEFAULT_PORT = 8082;
export const EXPO_GO_BUNDLE_ID = "host.exp.Exponent";

const SETTLE_MS = 60_000;
const BUNDLE_MS = 180_000;
const INTERVAL_MS = 500;
const METRO_MS = 120_000;
const METRO_POLL_MS = 500;
const PORT_PROBE_MS = 2_000;
const COMMAND_MS = 60_000;
const BOOT_MS = 180_000;

export function deepLink(port: number, path: string): string {
	return `exp://127.0.0.1:${port}/--/${path.replace(/^\//, "")}`;
}

type SimDevice = {
	name: string;
	udid: string;
	state?: unknown;
	isAvailable?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isSimDevice(value: unknown): value is SimDevice {
	return (
		isRecord(value) &&
		typeof value.name === "string" &&
		typeof value.udid === "string"
	);
}

export function pickDevice(
	listJson: unknown,
	name: string,
): { udid: string; booted: boolean } | null {
	if (!isRecord(listJson) || !isRecord(listJson.devices)) return null;
	// Numeric order, so that iOS 27 comes before iOS 9.
	const runtimes = Object.entries(listJson.devices).sort(([a], [b]) =>
		b.localeCompare(a, "en", { numeric: true }),
	);
	for (const [, devices] of runtimes) {
		if (!Array.isArray(devices)) continue;
		const found = devices
			.filter(isSimDevice)
			.find((d) => d.name === name && d.isAvailable !== false);
		if (found) return { udid: found.udid, booted: found.state === "Booted" };
	}
	return null;
}

export type Settle = { shots: Buffer[]; before: Buffer };

export function hasSettled(before: Buffer, shots: Buffer[]): boolean {
	const last = shots.at(-1);
	const previous = shots.at(-2);
	if (!last || !previous) return false;
	return last.equals(previous) && !last.equals(before);
}

export function portBusyMessage(
	port: number,
	answered: boolean,
): string | null {
	return answered
		? `port ${port} is already in use; stop the other Metro first`
		: null;
}

/** Reads Metro's terminal output for the result of an iOS bundle request. */
export function bundleState(log: string): "done" | "failed" | "pending" {
	const text = stripVTControlCharacters(log);
	if (text.includes("iOS Bundling failed")) return "failed";
	return text.includes("iOS Bundled") ? "done" : "pending";
}

const run = promisify(execFile);

async function simctl(args: string[], timeout = COMMAND_MS): Promise<string> {
	const { stdout } = await run("xcrun", ["simctl", ...args], { timeout });
	return stdout;
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorText(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

async function bootDevice(name: string): Promise<string> {
	const list: unknown = JSON.parse(
		await simctl(["list", "devices", "available", "-j"]),
	);
	const device = pickDevice(list, name);
	if (!device) throw new Error(`no available simulator named "${name}"`);
	if (!device.booted) await simctl(["boot", device.udid]);
	await simctl(["bootstatus", device.udid, "-b"], BOOT_MS);
	return device.udid;
}

function fetchStatus(port: number, timeout: number): Promise<Response> {
	return fetch(`http://127.0.0.1:${port}/status`, {
		signal: AbortSignal.timeout(timeout),
	});
}

// Another Metro on the port would answer the status wait and serve its own tree.
async function assertPortFree(port: number): Promise<void> {
	const answered = await fetchStatus(port, PORT_PROBE_MS).then(
		() => true,
		() => false,
	);
	const message = portBusyMessage(port, answered);
	if (message !== null) throw new Error(message);
}

// A fresh process with CI=1 (no file watching) and --clear serves the current tree.
function startMetro(repoRoot: string, port: number, logFile: string) {
	const log = openSync(logFile, "a");
	const metro = spawn(
		"scripts/project/pnpm.sh",
		[
			"--filter",
			"@waw-notes/client",
			"exec",
			"expo",
			"start",
			"--localhost",
			"--port",
			String(port),
			"--clear",
		],
		{
			cwd: repoRoot,
			// Its own process group, so that stopMetro reaches the children of pnpm too.
			detached: true,
			stdio: ["ignore", log, log],
			env: {
				...process.env,
				CI: "1",
				EXPO_OFFLINE: "1",
				EXPO_NO_TELEMETRY: "1",
			},
		},
	);
	// The child holds its own copy of the descriptor.
	closeSync(log);
	// A failed spawn leaves no pid; the status wait then reports that Metro did not start.
	metro.on("error", (error) => console.error(`Metro: ${error.message}`));
	return metro;
}

function stopMetro(pid: number | undefined): void {
	if (pid === undefined) return;
	try {
		process.kill(-pid, "SIGTERM");
	} catch (error) {
		// ESRCH: the whole group has already exited.
		if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
	}
}

async function waitForMetro(port: number): Promise<void> {
	const deadline = Date.now() + METRO_MS;
	while (Date.now() < deadline) {
		try {
			const response = await fetchStatus(port, 5_000);
			if ((await response.text()).includes("packager-status:running")) return;
		} catch {
			// Not listening yet: poll again until the deadline.
		}
		await wait(METRO_POLL_MS);
	}
	throw new Error(`Metro did not start within ${METRO_MS / 1000} s`);
}

async function screenshot(udid: string, file: string): Promise<Buffer> {
	await simctl(["io", udid, "screenshot", file]);
	return readFile(file);
}

// The loading splash of Expo Go is static, so screenshots are compared only after Metro has
// served the bundle for this launch.
async function waitForBundle(
	logFile: string,
	offset: number,
	bundleMs: number,
	intervalMs: number,
): Promise<void> {
	const deadline = Date.now() + bundleMs;
	for (;;) {
		const log = (await readFile(logFile)).subarray(offset).toString("utf8");
		const state = bundleState(log);
		if (state === "done") return;
		if (state === "failed") {
			const tail = log.trimEnd().split("\n").slice(-20).join("\n");
			throw new Error(`Metro failed to bundle for iOS: ${tail}`);
		}
		if (Date.now() >= deadline) {
			throw new Error(
				`Metro did not serve the iOS bundle within ${bundleMs / 1000} s`,
			);
		}
		await wait(intervalMs);
	}
}

type CaptureContext = {
	udid: string;
	port: number;
	tempDir: string;
	metroLog: string;
	bundleMs: number;
	settleMs: number;
	intervalMs: number;
};

/** Opens the screen and returns the temp file of the settled screenshot. */
async function openAndSettle(
	path: string,
	context: CaptureContext,
): Promise<string> {
	const { udid, port, tempDir, metroLog, settleMs, intervalMs } = context;
	// openurl only foregrounds an already loaded app, which can be an old bundle.
	// terminate fails when Expo Go is not running, which is the state wanted here.
	await simctl(["terminate", udid, EXPO_GO_BUNDLE_ID]).catch(() => {});
	const before = await screenshot(udid, join(tempDir, "before.png"));
	// Only what Metro writes from here on belongs to this launch.
	const logOffset = statSync(metroLog).size;
	await simctl(["openurl", udid, deepLink(port, path)]);
	await waitForBundle(metroLog, logOffset, context.bundleMs, intervalMs);
	const deadline = Date.now() + settleMs;
	const shots: Buffer[] = [];
	let index = 0;
	while (Date.now() < deadline) {
		await wait(intervalMs);
		const file = join(tempDir, `poll-${index++ % 2}.png`);
		shots.push(await screenshot(udid, file));
		if (shots.length > 2) shots.shift();
		if (hasSettled(before, shots)) return file;
	}
	throw new Error(`screen did not settle within ${settleMs / 1000} s`);
}

export async function captureIos(
	screens: ScreenEntry[],
	outDir: string,
	repoRoot: string,
	opts: {
		device?: string;
		port?: number;
		bundleMs?: number;
		settleMs?: number;
		intervalMs?: number;
	} = {},
): Promise<Shot[]> {
	if (process.platform !== "darwin") {
		throw new Error("iOS capture needs macOS");
	}
	const port = opts.port ?? DEFAULT_PORT;
	const failed = (
		screen: ScreenEntry,
		error: unknown,
		mockup: string | null,
	): Shot => ({
		screenId: screen.id,
		target: "ios",
		actual: null,
		mockup,
		error: errorText(error),
	});
	/** Copies the screen's mockup into outDir; returns its file name there. */
	const copyMockup = (screen: ScreenEntry): string | null => {
		const source = mockupPath(screen, "ios");
		if (source === null) return null;
		const name = shotName(screen.id, "ios", "mockup");
		copyFileSync(join(repoRoot, source), join(outDir, name));
		return name;
	};
	mkdirSync(outDir, { recursive: true });
	const tempDir = mkdtempSync(join(tmpdir(), "visual-ios-"));
	const metroLog = join(tempDir, "metro.log");
	let metroPid: number | undefined;
	try {
		let udid: string;
		try {
			udid = await bootDevice(opts.device ?? DEFAULT_DEVICE);
			await assertPortFree(port);
			metroPid = startMetro(repoRoot, port, metroLog).pid;
			await waitForMetro(port);
		} catch (error) {
			return screens.map((screen) => {
				try {
					return failed(screen, error, copyMockup(screen));
				} catch (copyError) {
					const both = `${errorText(error)}; ${errorText(copyError)}`;
					return failed(screen, both, null);
				}
			});
		}
		const context: CaptureContext = {
			udid,
			port,
			tempDir,
			metroLog,
			bundleMs: opts.bundleMs ?? BUNDLE_MS,
			settleMs: opts.settleMs ?? SETTLE_MS,
			intervalMs: opts.intervalMs ?? INTERVAL_MS,
		};
		const results: Shot[] = [];
		for (const screen of screens) {
			let mockup: string | null = null;
			try {
				mockup = copyMockup(screen);
				const settled = await openAndSettle(screen.path, context);
				const actual = shotName(screen.id, "ios", "actual");
				copyFileSync(settled, join(outDir, actual));
				results.push({
					screenId: screen.id,
					target: "ios",
					actual,
					mockup,
					error: null,
				});
			} catch (error) {
				results.push(failed(screen, error, mockup));
			}
		}
		return results;
	} finally {
		stopMetro(metroPid);
		rmSync(tempDir, { recursive: true, force: true });
	}
}
