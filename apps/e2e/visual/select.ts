import { type Manifest, mockupPath, type ScreenEntry } from "./manifest.ts";

export type Selection = { screens: ScreenEntry[]; reason: string };

export class UnknownScreenError extends Error {}

function touches(entry: ScreenEntry, file: string): boolean {
	return (
		entry.sources.some(
			(source) => file === source || file.startsWith(`${source}/`),
		) ||
		file === mockupPath(entry, "web-390") ||
		file === mockupPath(entry, "web-1440")
	);
}

export function selectScreens(
	m: Manifest,
	o: { all: boolean; names: string[]; changedFiles: string[] },
): Selection {
	if (o.names.length > 0) {
		const unknown = o.names.filter(
			(name) => !m.screens.some((screen) => screen.id === name),
		);
		if (unknown.length > 0) {
			throw new UnknownScreenError(`unknown screen: ${unknown.join(", ")}`);
		}
		const screens = m.screens.filter((screen) => o.names.includes(screen.id));
		return {
			screens,
			reason: `named: ${screens.map((screen) => screen.id).join(", ")}`,
		};
	}
	if (o.all) {
		return { screens: m.screens, reason: "all screens" };
	}
	const globalFile = o.changedFiles.find((file) =>
		m.global.some((entry) =>
			entry.endsWith("/") ? file.startsWith(entry) : file === entry,
		),
	);
	if (globalFile !== undefined) {
		return {
			screens: m.screens,
			reason: `global file changed: ${globalFile}`,
		};
	}
	const matches = m.screens.flatMap((screen) => {
		const file = o.changedFiles.find((changed) => touches(screen, changed));
		return file === undefined ? [] : [{ screen, file }];
	});
	if (matches.length === 0) {
		return { screens: [], reason: "no screen touched" };
	}
	const pairs = matches.map(({ screen, file }) => `${file} → ${screen.id}`);
	return {
		screens: matches.map(({ screen }) => screen),
		reason: `changed: ${pairs.join("; ")}`,
	};
}
