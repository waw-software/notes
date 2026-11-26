import { isAbsolute, relative, resolve } from "node:path";

export const APP_SCHEME = "waw-notes";
export const APP_HOST = "app";
export const APP_URL = "waw-notes://app/";

export function resolveExportFile(
	exportRoot: string,
	requestUrl: string,
): string | null {
	let pathname: string;
	try {
		const url = new URL(requestUrl);
		if (url.protocol !== `${APP_SCHEME}:` || url.host !== APP_HOST) {
			return null;
		}
		pathname = decodeURIComponent(url.pathname);
	} catch {
		// A malformed URL or percent escape names no file.
		return null;
	}

	const file = resolve(exportRoot, pathname.slice(1) || "index.html");
	const fromRoot = relative(exportRoot, file);
	if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
		return null;
	}
	return file;
}
