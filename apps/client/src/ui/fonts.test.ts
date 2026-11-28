import { useFonts } from "expo-font";
import { fontFamilies, fontSources, useAppFonts } from "./fonts";

jest.mock("@expo-google-fonts/inter/400Regular", () => ({
	Inter_400Regular: 101,
}));
jest.mock("@expo-google-fonts/inter/500Medium", () => ({
	Inter_500Medium: 102,
}));
jest.mock("@expo-google-fonts/inter/600SemiBold", () => ({
	Inter_600SemiBold: 103,
}));
jest.mock("@expo-google-fonts/space-grotesk/600SemiBold", () => ({
	SpaceGrotesk_600SemiBold: 201,
}));
jest.mock("expo-font", () => ({ useFonts: jest.fn() }));

const mockUseFonts = jest.mocked(useFonts);

describe("fonts", () => {
	beforeEach(() => {
		mockUseFonts.mockReset();
	});

	it("fontFamilies names the four loaded faces", () => {
		expect(fontFamilies).toMatchObject({
			bodyRegular: "Inter_400Regular",
			bodyMedium: "Inter_500Medium",
			bodySemibold: "Inter_600SemiBold",
			headingSemibold: "SpaceGrotesk_600SemiBold",
		});
	});

	it("the mono family is Menlo on iOS", () => {
		expect(fontFamilies.mono).toBe("Menlo");
	});

	it("fontSources maps each alias to its own asset", () => {
		expect(fontSources).toEqual({
			Inter_400Regular: 101,
			Inter_500Medium: 102,
			Inter_600SemiBold: 103,
			SpaceGrotesk_600SemiBold: 201,
		});
	});

	it("useAppFonts passes fontSources to useFonts and returns its result", () => {
		const result: [boolean, Error | null] = [true, null];
		mockUseFonts.mockReturnValue(result);

		const returned = useAppFonts();

		expect(mockUseFonts).toHaveBeenCalledTimes(1);
		expect(mockUseFonts).toHaveBeenCalledWith({
			Inter_400Regular: 101,
			Inter_500Medium: 102,
			Inter_600SemiBold: 103,
			SpaceGrotesk_600SemiBold: 201,
		});
		expect(returned).toBe(result);
	});

	it("useAppFonts returns the error from useFonts", () => {
		const error = new Error("load");
		const result: [boolean, Error | null] = [false, error];
		mockUseFonts.mockReturnValue(result);

		const returned = useAppFonts();

		expect(returned).toBe(result);
		expect(returned).toEqual([false, error]);
	});
});
