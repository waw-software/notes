import { theme } from "@waw/design-tokens";
import { Pressable, StyleSheet, Text } from "react-native";
import { fontFamilies } from "./fonts";

export type FilterPillProps = {
	label: string;
	selected: boolean;
	onPress: () => void;
	emoji?: string;
};

export function FilterPill({
	label,
	selected,
	onPress,
	emoji,
}: FilterPillProps) {
	return (
		<Pressable
			accessibilityRole="button"
			role="button"
			accessibilityLabel={label}
			aria-label={label}
			accessibilityState={{ selected }}
			aria-pressed={selected}
			onPress={onPress}
			style={[styles.pill, selected ? styles.selected : styles.unselected]}
		>
			{emoji !== undefined && (
				<Text
					aria-hidden
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
					style={styles.text}
				>
					{emoji}
				</Text>
			)}
			<Text
				style={[
					styles.text,
					selected ? styles.selectedLabel : styles.unselectedLabel,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	pill: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "flex-start",
		gap: theme.space.segmentIconGap,
		minHeight: theme.size.touchTarget,
		minWidth: theme.size.touchTarget,
		paddingHorizontal: theme.space.optionInline,
		borderWidth: theme.size.controlBorder,
		borderRadius: theme.radius.pill,
	},
	selected: {
		borderColor: theme.color.ink,
		backgroundColor: theme.color.ink,
	},
	unselected: {
		borderColor: theme.color["border-strong"],
		backgroundColor: theme.color.bg,
	},
	text: {
		fontFamily: fontFamilies.bodyMedium,
		fontSize: theme.type.controlSupport,
	},
	selectedLabel: {
		color: theme.color.bg,
	},
	unselectedLabel: {
		color: theme.color.ink,
	},
});
