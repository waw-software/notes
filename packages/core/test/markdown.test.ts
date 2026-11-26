import { expect, it } from "vitest";

it("loads the empty Markdown parser module", async () => {
	const module = await import("../src/markdown.js");

	expect(Object.keys(module)).toEqual([]);
});
