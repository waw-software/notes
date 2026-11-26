import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, net, protocol } from "electron";
import { APP_SCHEME, APP_URL, resolveExportFile } from "./web-export";

function createWindow(): void {
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			sandbox: true,
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	mainWindow.loadURL(APP_URL);
}

// The web export uses root-relative asset URLs, which need an origin that file: lacks.
protocol.registerSchemesAsPrivileged([
	{
		scheme: APP_SCHEME,
		privileges: { standard: true, secure: true, supportFetchAPI: true },
	},
]);

app.whenReady().then(() => {
	const exportRoot = join(app.getAppPath(), "..", "client", "dist");

	protocol.handle(APP_SCHEME, (request) => {
		const file = resolveExportFile(exportRoot, request.url);
		if (!file) {
			return new Response("Not found", { status: 404 });
		}
		return net.fetch(pathToFileURL(file).toString());
	});

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
