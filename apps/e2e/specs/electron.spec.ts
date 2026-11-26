import { expect, test } from "@playwright/test";
import { launchDesktop } from "../electron.ts";

test("the desktop window loads the web export", async () => {
	const { app, window } = await launchDesktop();
	try {
		expect(window.url()).toMatch(/^waw-notes:\/\/app\//);
		await expect(
			window.getByRole("heading", { name: "WAW Notes" }),
		).toBeVisible();
	} finally {
		await app.close();
	}
});
