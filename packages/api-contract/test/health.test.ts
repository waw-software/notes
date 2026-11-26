import { Value } from "typebox/value";
import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "../src/health.js";

describe("HealthResponseSchema", () => {
	it("accepts the initial health response", () => {
		expect(
			Value.Check(HealthResponseSchema, { apiVersion: 1, capabilities: [] }),
		).toBe(true);
	});

	it("accepts a health response with a new capability and field", () => {
		expect(
			Value.Check(HealthResponseSchema, {
				apiVersion: 1,
				capabilities: ["import"],
				extra: true,
			}),
		).toBe(true);
	});

	it.each([
		{ apiVersion: 0, capabilities: [] },
		{ apiVersion: 1.5, capabilities: [] },
		{ apiVersion: 1, capabilities: [1] },
		{ capabilities: [] },
		{ apiVersion: 1 },
	])("rejects an invalid health response: %j", (response) => {
		expect(Value.Check(HealthResponseSchema, response)).toBe(false);
	});
});
