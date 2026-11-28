import { theme } from "@waw/design-tokens";
import { useEffect, useRef, useState } from "react";
import {
	AccessibilityInfo,
	TextInput as NativeTextInput,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { fontFamilies } from "./fonts";
import { notesTheme } from "./theme";

export type TextInputProps = {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	kind?: "text" | "url" | "token";
	helperText?: string;
	errorText?: string;
	disabled?: boolean;
	layout?: "mobile" | "desktop";
};

export function TextInput({
	label,
	value,
	onValueChange,
	kind = "text",
	helperText,
	errorText,
	disabled = false,
	layout = "mobile",
}: TextInputProps) {
	const [focused, setFocused] = useState(false);
	// The error present at mount stays readable on screen and is not announced.
	const lastError = useRef(errorText);
	const verbatim = kind !== "text";

	useEffect(() => {
		if (errorText && errorText !== lastError.current) {
			AccessibilityInfo.announceForAccessibility(errorText);
		}
		lastError.current = errorText;
	}, [errorText]);

	return (
		<View style={styles.field}>
			<Text style={styles.label}>{label}</Text>
			<NativeTextInput
				value={value}
				onChangeText={onValueChange}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				accessibilityLabel={label}
				aria-label={label}
				accessibilityHint={errorText || helperText}
				accessibilityState={{ disabled }}
				aria-disabled={disabled}
				editable={!disabled}
				keyboardType={kind === "url" ? "url" : "default"}
				secureTextEntry={kind === "token"}
				{...(verbatim ? { autoCapitalize: "none", autoCorrect: false } : {})}
				style={[
					styles.input,
					styles[layout],
					verbatim && styles.mono,
					(focused || !!errorText) && styles.accentEdge,
					disabled && styles.disabled,
				]}
			/>
			{errorText ? (
				<Text aria-live="polite" style={styles.error}>
					{errorText}
				</Text>
			) : (
				!!helperText && <Text style={styles.helper}>{helperText}</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	field: {
		gap: theme.space.fieldGap,
	},
	label: {
		fontFamily: fontFamilies.bodyMedium,
		fontSize: theme.type.controlSupport,
		color: theme.color["ink-2"],
	},
	input: {
		paddingHorizontal: theme.space.optionInline,
		borderWidth: theme.size.controlBorder,
		borderRadius: theme.radius.input,
		borderColor: theme.color["border-strong"],
		backgroundColor: theme.color.bg,
		fontFamily: fontFamilies.bodyRegular,
		fontSize: theme.type.bodyMax,
		color: theme.color.ink,
	},
	mobile: {
		minHeight: notesTheme.size.mobileInput,
	},
	// DesktopConnect.dc.html draws the desktop field at the mobile height.
	desktop: {
		minHeight: notesTheme.size.mobileInput,
	},
	mono: {
		fontFamily: fontFamilies.mono,
	},
	accentEdge: {
		borderColor: theme.color["accent-text"],
	},
	disabled: {
		borderColor: theme.color["border-strong"],
		color: theme.color.muted,
	},
	helper: {
		fontFamily: fontFamilies.bodyRegular,
		fontSize: theme.type.meta,
		color: theme.color.muted,
	},
	error: {
		fontFamily: fontFamilies.bodyRegular,
		fontSize: theme.type.meta,
		color: theme.color["accent-text"],
	},
});
