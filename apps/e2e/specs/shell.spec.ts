import { expect, test } from "@playwright/test";

test("the client shell shows the WAW Notes heading", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { name: "WAW Notes" })).toBeVisible();
});
