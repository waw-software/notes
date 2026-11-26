import { expect, test } from "@playwright/test";

test("REQ-021 AC-57: GET /health on a started server returns the API version and capabilities", async ({
	request,
}) => {
	const res = await request.get("/health");

	expect(res.status()).toBe(200);
	expect(await res.json()).toEqual({ apiVersion: 1, capabilities: [] });
});
