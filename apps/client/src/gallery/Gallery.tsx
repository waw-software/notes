import { useWindowDimensions } from "react-native";
import { notesTheme } from "../ui/theme";
import GalleryForms from "./GalleryForms";
import type { GallerySection } from "./route";

export default function Gallery({ section }: { section: GallerySection }) {
	const { width } = useWindowDimensions();
	const layout = width < notesTheme.size.sidebarFrom ? "mobile" : "desktop";

	switch (section) {
		case "forms":
			return <GalleryForms layout={layout} />;
	}
}
