import { StyleSheet, Text, View } from "react-native";

export default function App(): React.JSX.Element {
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
