import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { SpaceGrotesk_600SemiBold } from "@expo-google-fonts/space-grotesk/600SemiBold";
import { useFonts } from "expo-font";
import { Platform } from "react-native";

export const fontFamilies = {
	bodyRegular: "Inter_400Regular",
	bodyMedium: "Inter_500Medium",
	bodySemibold: "Inter_600SemiBold",
	headingSemibold: "SpaceGrotesk_600SemiBold",
	mono: Platform.select({
		ios: "Menlo",
		default: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
	}),
} as const;

export const fontSources: Readonly<
	Record<
		| "Inter_400Regular"
		| "Inter_500Medium"
		| "Inter_600SemiBold"
		| "SpaceGrotesk_600SemiBold",
		number
	>
> = {
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	SpaceGrotesk_600SemiBold,
};

export function useAppFonts(): readonly [loaded: boolean, error: Error | null] {
	return useFonts(fontSources);
}
