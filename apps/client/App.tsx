import { StyleSheet, Text, View } from "react-native";

export default function App(): React.JSX.Element {
	if (process.env.EXPO_PUBLIC_EDITOR_SPIKE === "1") {
		// Required here so that the normal path does not load the spike or its editors.
		const { default: EditorSpikeScreen } =
			require("./src/editor-spike/EditorSpikeScreen") as typeof import("./src/editor-spike/EditorSpikeScreen");
		const { candidates } =
			require("./src/editor-spike/candidates") as typeof import("./src/editor-spike/candidates");
		return <EditorSpikeScreen candidates={candidates} />;
	}
	return (
		<View style={styles.container}>
			<Text accessibilityRole="header">WAW Notes</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
