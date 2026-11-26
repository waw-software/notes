import { createRequire } from "node:module";
import { join } from "node:path";
import {
	_electron,
	type ElectronApplication,
	type Page,
} from "@playwright/test";

const desktopDir = join(import.meta.dirname, "..", "desktop");

export async function launchDesktop(): Promise<{
	app: ElectronApplication;
	window: Page;
}> {
	// With the isolated linker only apps/desktop can resolve the electron package.
	const executablePath = createRequire(join(desktopDir, "package.json"))(
		"electron",
	) as string;
	// The SUID sandbox helper of the installed binary is not set up on Linux CI.
	const noSandbox =
		process.platform === "linux" && process.env.CI ? ["--no-sandbox"] : [];
	const app = await _electron.launch({
		executablePath,
		args: [...noSandbox, desktopDir],
		cwd: desktopDir,
	});
	const window = await app.firstWindow();
	await window.waitForLoadState("domcontentloaded");
	return { app, window };
}

export async function setDesktopSize(
	app: ElectronApplication,
	width: number,
	height: number,
): Promise<void> {
	await app.evaluate(
		({ BrowserWindow }, s) => {
			BrowserWindow.getAllWindows()[0]?.setContentSize(s.w, s.h);
		},
		{ w: width, h: height },
	);
}
