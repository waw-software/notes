import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

export const SERVER_URL = "http://127.0.0.1:3100";
export const CLIENT_URL = "http://127.0.0.1:8090";

type ProjectUse = NonNullable<PlaywrightTestConfig["use"]>;

const web390: ProjectUse = {
	baseURL: CLIENT_URL,
	browserName: "chromium",
	viewport: { width: 390, height: 844 },
	deviceScaleFactor: 2,
};

const web1440: ProjectUse = {
	baseURL: CLIENT_URL,
	browserName: "chromium",
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 2,
};

const healthSpec = /specs\/health\.spec\.ts$/;
const shellSpec = /specs\/shell\.spec\.ts$/;
const electronSpec = /specs\/electron\.spec\.ts$/;
const visualCapture = /visual\/capture\.pw\.ts$/;

export default defineConfig({
	testDir: ".",
	retries: 0,
	forbidOnly: true,
	reporter: [["list"]],
	outputDir: "test-results",
	fullyParallel: false,
	workers: 1,
	projects: [
		{ name: "server", testMatch: healthSpec, use: { baseURL: SERVER_URL } },
		{ name: "web-390", testMatch: shellSpec, use: web390 },
		{ name: "web-1440", testMatch: shellSpec, use: web1440 },
		{ name: "electron", testMatch: electronSpec },
		{ name: "visual-390", testMatch: visualCapture, use: web390 },
		{ name: "visual-1440", testMatch: visualCapture, use: web1440 },
		{ name: "visual-electron", testMatch: visualCapture },
	],
	webServer: [
		{
			command: "node ../server/dist/api.js",
			url: `${SERVER_URL}/health`,
			env: { PORT: "3100", HOST: "127.0.0.1" },
			// A process already on the port fails the run instead of being tested.
			reuseExistingServer: false,
			timeout: 120_000,
		},
		{
			command:
				"../../scripts/project/pnpm.sh --filter @waw-notes/client exec expo serve --port 8090",
			url: CLIENT_URL,
			env: { CI: "1", EXPO_OFFLINE: "1", EXPO_NO_TELEMETRY: "1" },
			// A process already on the port fails the run instead of being tested.
			reuseExistingServer: false,
			timeout: 120_000,
		},
	],
});
