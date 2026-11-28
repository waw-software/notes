export type GallerySection = "forms";

export const GALLERY_SECTIONS: readonly GallerySection[] = ["forms"];

// Only the query is read, by hand: URL.searchParams is not reliable under Hermes.
export function galleryRoute(url: string | null): GallerySection | null {
	if (url === null) {
		return null;
	}
	// Cutting the fragment first also drops a "?" that belongs to it.
	const [beforeFragment = ""] = url.split("#");
	const queryStart = beforeFragment.indexOf("?");
	if (queryStart === -1) {
		return null;
	}
	const parameters = beforeFragment.slice(queryStart + 1).split("&");
	return (
		GALLERY_SECTIONS.find((section) =>
			parameters.includes(`screen=gallery-${section}`),
		) ?? null
	);
}
