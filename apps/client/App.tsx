import { theme } from "@waw/design-tokens";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import Gallery from "./src/gallery/Gallery";
import { type GallerySection, galleryRoute } from "./src/gallery/route";
import { fontFamilies, useAppFonts } from "./src/ui/fonts";

export default function App(): React.JSX.Element {
	if (process.env.EXPO_PUBLIC_EDITOR_SPIKE === "1") {
		// Required here so that the normal path does not load the spike or its editors.
		const { default: EditorSpikeScreen } =
			require("./src/editor-spike/EditorSpikeScreen") as typeof import("./src/editor-spike/EditorSpikeScreen");
		const { candidates } =
			require("./src/editor-spike/candidates") as typeof import("./src/editor-spike/candidates");
		return <EditorSpikeScreen candidates={candidates} />;
	}
	return <NotesApp />;
}

function NotesApp(): React.JSX.Element | null {
	const [fontsLoaded, fontError] = useAppFonts();
	const [section, setSection] = useState<GallerySection | null>(null);

	useEffect(() => {
		if (fontError) {
			console.warn("Fonts failed to load", fontError);
		}
	}, [fontError]);

	useEffect(() => {
		const open = (url: string | null | undefined) => {
			setSection(galleryRoute(url ?? null));
		};
		Linking.getInitialURL().then(open);
		const subscription = Linking.addEventListener("url", ({ url }) =>
			open(url),
		);
		return () => subscription.remove();
	}, []);

	// A font error wins over the gallery: the shell in system fonts, whatever the URL.
	if (fontError) {
		return <Shell />;
	}
	if (!fontsLoaded) {
		return null;
	}
	if (section !== null) {
		return <Gallery section={section} />;
	}
	return <Shell headingStyle={styles.heading} />;
}

function Shell({
	headingStyle,
}: {
	headingStyle?: typeof styles.heading;
}): React.JSX.Element {
	return (
		<View style={styles.container}>
			<Text accessibilityRole="header" style={headingStyle}>
				WAW Notes
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	heading: {
		fontFamily: fontFamilies.headingSemibold,
		fontSize: theme.type.screen,
		color: theme.color.ink,
	},
});
