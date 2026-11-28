import { act, render, screen } from "@testing-library/react-native";
import type { ComponentType } from "react";
import { Linking, StyleSheet } from "react-native";
import App from "./App";

// The registry is the boundary: the real adapters cannot render in the iOS Jest environment.
jest.mock("./src/editor-spike/candidates", () => ({
	candidates: [{ id: "fake", label: "Fake", Editor: () => null }],
}));

// Font loading is a boundary: each case decides whether the fonts have loaded or failed.
const mockUseAppFonts = jest.fn();
jest.mock("./src/ui/fonts", () => ({
	...jest.requireActual("./src/ui/fonts"),
	useAppFonts: () => mockUseAppFonts(),
}));

const shellUrl = "http://127.0.0.1:8090/";
const formsUrl = "http://127.0.0.1:8090/?screen=gallery-forms";

function openedWith(url: string | undefined) {
	jest.spyOn(Linking, "getInitialURL").mockResolvedValue(url as string);
}

function shellHeading() {
	return screen.getByRole("header", { name: "WAW Notes" });
}

function headingStyle() {
	return StyleSheet.flatten(shellHeading().props.style) ?? {};
}

describe("App", () => {
	beforeEach(() => {
		mockUseAppFonts.mockReturnValue([true, null]);
		openedWith(shellUrl);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("renders the WAW Notes heading", async () => {
		await render(<App />);

		const heading = screen.getByRole("header", { name: "WAW Notes" });
		expect(heading).toBeOnTheScreen();
		expect(heading).toHaveTextContent("WAW Notes", { exact: true });
	});

	it("renders nothing until the fonts load, then the shell", async () => {
		mockUseAppFonts.mockReturnValue([false, null]);
		const { rerender, toJSON } = await render(<App />);

		expect(toJSON()).toBeNull();

		mockUseAppFonts.mockReturnValue([true, null]);
		await rerender(<App />);

		expect(headingStyle().fontFamily).toBe("SpaceGrotesk_600SemiBold");
	});

	it("renders nothing until the fonts load, then the forms gallery", async () => {
		mockUseAppFonts.mockReturnValue([false, null]);
		openedWith(formsUrl);
		const { rerender, toJSON } = await render(<App />);

		expect(toJSON()).toBeNull();

		mockUseAppFonts.mockReturnValue([true, null]);
		await rerender(<App />);

		expect(
			(await screen.findAllByLabelText("Access token")).length,
		).toBeGreaterThan(0);
		expect(screen.queryByRole("header", { name: "WAW Notes" })).toBeNull();
	});

	it("a font failure shows the system-font shell even on a gallery URL, and warns", async () => {
		const error = new Error("load");
		mockUseAppFonts.mockReturnValue([false, error]);
		openedWith(formsUrl);
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

		await render(<App />);

		expect(shellHeading()).toBeOnTheScreen();
		expect(headingStyle().fontFamily).toBeUndefined();
		expect(screen.queryAllByLabelText("Access token")).toHaveLength(0);
		expect(warn).toHaveBeenCalledWith("Fonts failed to load", error);
	});

	it("opens the forms gallery for ?screen=gallery-forms", async () => {
		openedWith(formsUrl);

		await render(<App />);

		expect(
			(await screen.findAllByLabelText("Access token")).length,
		).toBeGreaterThan(0);
		expect(screen.queryByRole("header", { name: "WAW Notes" })).toBeNull();
	});

	it("a section that does not exist yet shows the shell", async () => {
		openedWith("http://127.0.0.1:8090/?screen=gallery-lists");

		await render(<App />);

		expect(
			await screen.findByRole("header", { name: "WAW Notes" }),
		).toBeOnTheScreen();
	});

	it("an undefined initial URL shows the shell", async () => {
		openedWith(undefined);

		await render(<App />);

		expect(
			await screen.findByRole("header", { name: "WAW Notes" }),
		).toBeOnTheScreen();
	});

	it("a url event opens the gallery", async () => {
		const listen = jest.spyOn(Linking, "addEventListener");
		// The preset's mock keeps the listeners of the earlier cases.
		listen.mockClear();
		await render(<App />);
		const listener = listen.mock.calls.find(([type]) => type === "url")?.[1];

		await act(async () => {
			listener?.({ url: "waw-notes://app/?screen=gallery-forms" });
		});

		expect(
			(await screen.findAllByLabelText("Access token")).length,
		).toBeGreaterThan(0);
		expect(screen.queryByRole("header", { name: "WAW Notes" })).toBeNull();
	});

	it("opens the editor spike only with EXPO_PUBLIC_EDITOR_SPIKE=1", async () => {
		const previous = process.env.EXPO_PUBLIC_EDITOR_SPIKE;
		process.env.EXPO_PUBLIC_EDITOR_SPIKE = "1";
		try {
			let SpikeApp: ComponentType = App;
			jest.isolateModules(() => {
				SpikeApp = require("./App").default;
			});

			await render(<SpikeApp />);

			expect(screen.getByText("Editor spike")).toBeOnTheScreen();
			expect(
				screen.getByRole("button", { name: "Use Fake" }),
			).toBeOnTheScreen();
			expect(screen.queryByRole("header", { name: "WAW Notes" })).toBeNull();
		} finally {
			if (previous === undefined) {
				delete process.env.EXPO_PUBLIC_EDITOR_SPIKE;
			} else {
				process.env.EXPO_PUBLIC_EDITOR_SPIKE = previous;
			}
		}
	});
});
