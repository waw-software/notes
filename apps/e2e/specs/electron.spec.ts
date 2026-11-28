import { expect, type Page, test } from "@playwright/test";
import { launchDesktop } from "../electron.ts";

// check() alone is true for a family that is not in the set, so loaded is the proof.
async function fontState(
	page: Page,
	family: string,
): Promise<{ check: boolean; loaded: boolean }> {
	return page.evaluate(async (name) => {
		await document.fonts.ready;
		let loaded = false;
		document.fonts.forEach((face) => {
			if (face.family.replace(/["']/g, "") === name && face.status === "loaded")
				loaded = true;
		});
		return { check: document.fonts.check(`600 28px ${name}`), loaded };
	}, family);
}

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

test("the desktop window loads the fonts", async () => {
	const { app, window } = await launchDesktop();
	try {
		const heading = window.getByRole("heading", { name: "WAW Notes" });
		await expect(heading).toBeVisible();

		expect(await fontState(window, "SpaceGrotesk_600SemiBold")).toEqual({
			check: true,
			loaded: true,
		});
		expect(
			await heading.evaluate((el) => getComputedStyle(el).fontFamily),
		).toContain("SpaceGrotesk_600SemiBold");
	} finally {
		await app.close();
	}
});

test("the desktop window opens the forms gallery in Inter", async () => {
	const { app, window } = await launchDesktop();
	try {
		await window.goto("waw-notes://app/?screen=gallery-forms");
		const label = window.getByText("Connect", { exact: true }).first();
		await expect(label).toBeVisible();

		expect(await fontState(window, "Inter_600SemiBold")).toEqual({
			check: true,
			loaded: true,
		});
		expect(
			await label.evaluate((el) => getComputedStyle(el).fontFamily),
		).toContain("Inter_600SemiBold");
	} finally {
		await app.close();
	}
});
