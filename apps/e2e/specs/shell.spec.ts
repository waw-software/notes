import { expect, type Page, test } from "@playwright/test";

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

test("the client shell shows the WAW Notes heading", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { name: "WAW Notes" })).toBeVisible();
});

test("the shell heading is set in Space Grotesk, loaded from the bundle", async ({
	page,
}) => {
	await page.goto("/");
	const heading = page.getByRole("heading", { name: "WAW Notes" });
	await expect(heading).toBeVisible();

	expect(await fontState(page, "SpaceGrotesk_600SemiBold")).toEqual({
		check: true,
		loaded: true,
	});
	expect(
		await heading.evaluate((el) => getComputedStyle(el).fontFamily),
	).toContain("SpaceGrotesk_600SemiBold");
});

test("the forms gallery sets its labels in Inter", async ({ page }) => {
	await page.goto("/?screen=gallery-forms");
	const label = page.getByText("Connect", { exact: true }).first();
	await expect(label).toBeVisible();

	expect(await fontState(page, "Inter_600SemiBold")).toEqual({
		check: true,
		loaded: true,
	});
	expect(
		await label.evaluate((el) => getComputedStyle(el).fontFamily),
	).toContain("Inter_600SemiBold");
});
