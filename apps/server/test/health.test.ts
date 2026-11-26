import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /health", () => {
	let app: ReturnType<typeof createApp> | undefined;

	afterEach(async () => {
		await app?.close();
	});

	it("REQ-021 AC-57: GET /health returns the initial API version and capabilities", async () => {
		app = createApp();
		const res = await app.inject({ method: "GET", url: "/health" });

		expect(res.statusCode).toBe(200);
		expect(res.headers["content-type"]).toMatch(/^application\/json/);
		expect(res.json()).toEqual({ apiVersion: 1, capabilities: [] });
	});
});
