import { describe, expect, it } from "vitest";
import type { ScreenEntry, Target } from "./manifest.ts";
import { renderReport, type Shot } from "./report.ts";

const screen: ScreenEntry = {
	id: "shell",
	title: "Client shell",
	path: "/",
	sources: ["apps/client/App.tsx"],
	mobile: { mockup: null },
	desktop: { mockup: null },
};

function shot(over: Partial<Shot> = {}): Shot {
	return {
		screenId: "shell",
		target: "web-390",
		actual: "shell.web-390.actual.png",
		mockup: "shell.web-390.mockup.png",
		error: null,
		...over,
	};
}

const render = (shots: Shot[], entry: ScreenEntry = screen) =>
	renderReport([entry], shots, "2026-11-26T10:00:00Z");

const rows = (html: string) => html.split('<div class="pair">').slice(1);

describe("renderReport", () => {
	it("renders a document with the heading, the time and a section per screen", () => {
		const html = render([shot()]);
		expect(html).toMatch(/^<!doctype html>/);
		expect(html).toContain("<h1>Visual check</h1>");
		expect(html).toContain("2026-11-26T10:00:00Z");
		expect(html).toContain("<h2>Client shell (shell)</h2>");
	});

	it("a null mockup renders 'no mockup yet'", () => {
		const html = render([shot({ mockup: null })]);
		expect(html).toContain("no mockup yet");
		expect(html.match(/<img /g)).toHaveLength(1);
	});

	it("both images of a pair are in one row", () => {
		const html = render([
			shot(),
			shot({
				target: "electron",
				actual: "shell.electron.actual.png",
				mockup: "shell.electron.mockup.png",
			}),
		]);
		const [mobile, desktop, ...rest] = rows(html);
		expect(rest).toEqual([]);
		expect(mobile).toContain('src="shell.web-390.mockup.png"');
		expect(mobile).toContain('src="shell.web-390.actual.png"');
		expect(mobile).not.toContain("shell.electron");
		expect(desktop).toContain('src="shell.electron.mockup.png"');
		expect(desktop).toContain('src="shell.electron.actual.png"');
	});

	it("a shot with an error shows the error text and no actual image", () => {
		const html = render([shot({ error: "screen did not settle" })]);
		expect(html).toContain('<p class="error">screen did not settle</p>');
		expect(html).not.toContain("shell.web-390.actual.png");
	});

	it("a missing actual without error shows 'not captured'", () => {
		const html = render([shot({ actual: null })]);
		expect(html).toContain("not captured");
		expect(html).not.toContain('class="error"');
	});

	it("HTML in a title and an error is escaped", () => {
		const html = render([shot({ error: `<script>"x" & 'y'</script>` })], {
			...screen,
			title: "<b>Shell</b>",
		});
		expect(html).toContain("&lt;b&gt;Shell&lt;/b&gt;");
		expect(html).toContain(
			"&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;",
		);
		expect(html).not.toContain("<script>");
		expect(html).not.toContain("<b>");
	});

	it.each<[Target, string]>([
		["web-390", "390px"],
		["ios", "390px"],
		["web-1440", "1440px"],
		["electron", "1440px"],
	])(
		"desktop targets render at 1440px and mobile at 390px: %s",
		(target, width) => {
			const html = render([shot({ target })]);
			expect(
				[...html.matchAll(/<img [^>]*style="width: (\d+px)"/g)].map(
					(m) => m[1],
				),
			).toEqual([width, width]);
		},
	);
});
