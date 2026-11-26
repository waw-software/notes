import { describe, expect, it } from "vitest";
import { resolveExportFile } from "./web-export";

describe("web export", () => {
	it.each([
		["waw-notes://app/", "/export/index.html"],
		[
			"waw-notes://app/_expo/static/js/web/index-abc123.js",
			"/export/_expo/static/js/web/index-abc123.js",
		],
		["waw-notes://app/a%20b.css", "/export/a b.css"],
		["waw-notes://app/..%2F..%2Fsecret", null],
		["waw-notes://other/index.html", null],
		["https://app/index.html", null],
		["not a url", null],
		["waw-notes://app/%E0%A4%A", null],
	])(
		"resolveExportFile maps app URLs inside the export root: %s -> %s",
		(requestUrl, expected) => {
			expect(resolveExportFile("/export", requestUrl)).toBe(expected);
		},
	);
});
