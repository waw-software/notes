import { type ScreenEntry, TARGETS, type Target } from "./manifest.ts";

export type Shot = {
	screenId: string;
	target: Target;
	/** File name relative to the report directory. */
	actual: string | null;
	/** File name relative to the report directory. */
	mockup: string | null;
	error: string | null;
};

const ENTITIES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

const STYLE = `
body { font-family: system-ui, sans-serif; margin: 24px; }
.pair { display: flex; gap: 24px; align-items: flex-start; margin-bottom: 32px; }
.cell { flex: none; }
img { display: block; border: 1px solid #ccc; }
.error { color: #b00020; white-space: pre-wrap; }
`;

function image(file: string, alt: string, width: number): string {
	return `<img src="${escapeHtml(file)}" alt="${escapeHtml(alt)}" style="width: ${width}px">`;
}

function cell(label: string, width: number, content: string): string {
	return `<div class="cell" style="min-width: ${width}px"><h4>${label}</h4>${content}</div>`;
}

function row(title: string, shot: Shot): string {
	const width = shot.target === "web-390" || shot.target === "ios" ? 390 : 1440;
	const alt = `${title}, ${shot.target}`;
	const mockup =
		shot.mockup === null
			? "<p>no mockup yet</p>"
			: image(shot.mockup, `Mockup: ${alt}`, width);
	let actual = "<p>not captured</p>";
	if (shot.error !== null) {
		actual = `<p class="error">${escapeHtml(shot.error)}</p>`;
	} else if (shot.actual !== null) {
		actual = image(shot.actual, `Actual: ${alt}`, width);
	}
	return `<h3>${shot.target}</h3>
<div class="pair">${cell("Mockup", width, mockup)}${cell("Actual", width, actual)}</div>`;
}

function section(screen: ScreenEntry, shots: Shot[]): string {
	const rows = TARGETS.flatMap((target) =>
		shots
			.filter((shot) => shot.screenId === screen.id && shot.target === target)
			.map((shot) => row(screen.title, shot)),
	);
	return `<section>
<h2>${escapeHtml(screen.title)} (${escapeHtml(screen.id)})</h2>
${rows.join("\n")}
</section>`;
}

export function renderReport(
	screens: ScreenEntry[],
	shots: Shot[],
	generatedAt: string,
): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Visual check</title>
<style>${STYLE}</style>
</head>
<body>
<h1>Visual check</h1>
<p>${escapeHtml(generatedAt)}</p>
${screens.map((screen) => section(screen, shots)).join("\n")}
</body>
</html>
`;
}
