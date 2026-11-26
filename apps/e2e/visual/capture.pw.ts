// Captures the screens of one visual run. Playwright runs it, started by run.ts.
import { join, resolve } from "node:path";
import { type Page, test } from "@playwright/test";
import { launchDesktop, setDesktopSize } from "../electron.ts";
import { CLIENT_URL } from "../playwright.config.ts";
import {
	desktopHeight,
	loadManifest,
	type ScreenEntry,
	shotName,
	type Target,
} from "./manifest.ts";

const PROJECT_TARGETS: Record<string, Target> = {
	"visual-390": "web-390",
	"visual-1440": "web-1440",
	"visual-electron": "electron",
};

function requiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`${name} is not set; run the capture through scripts/visual.sh`,
		);
	}
	return value;
}

const ids = requiredEnv("VISUAL_SCREENS").split(",");
const outDir = requiredEnv("VISUAL_OUT");
const manifest = loadManifest(resolve(import.meta.dirname, "../../.."));

async function capture(
	page: Page,
	url: string,
	entry: ScreenEntry,
	target: Target,
): Promise<void> {
	await page.goto(url);
	await page.waitForLoadState("networkidle");
	await page.evaluate(() => document.fonts.ready.then(() => undefined));
	await page.screenshot({
		path: join(outDir, shotName(entry.id, target, "actual")),
	});
}

async function captureElectron(entry: ScreenEntry): Promise<void> {
	const { app, window } = await launchDesktop();
	try {
		await setDesktopSize(app, 1440, desktopHeight(entry));
		await capture(window, `waw-notes://app${entry.path}`, entry, "electron");
	} finally {
		await app.close();
	}
}

for (const id of ids) {
	const entry = manifest.screens.find((screen) => screen.id === id);
	if (entry === undefined) {
		throw new Error(`unknown screen: ${id}`);
	}
	// Fixtures are fixed per test, so the electron project gets a page too and leaves it unused.
	test(`${id}`, async ({ page }) => {
		const target = PROJECT_TARGETS[test.info().project.name];
		if (target === undefined) {
			throw new Error(`not a visual project: ${test.info().project.name}`);
		}
		if (target === "electron") {
			await captureElectron(entry);
			return;
		}
		if (target === "web-1440") {
			await page.setViewportSize({ width: 1440, height: desktopHeight(entry) });
		}
		await capture(page, CLIENT_URL + entry.path, entry, target);
	});
}
