import { render, screen } from "@testing-library/react-native";
import type { ComponentType } from "react";
import App from "./App";

// The registry is the boundary: the real adapters cannot render in the iOS Jest environment.
jest.mock("./src/editor-spike/candidates", () => ({
	candidates: [{ id: "fake", label: "Fake", Editor: () => null }],
}));

describe("App", () => {
	it("renders the WAW Notes heading", async () => {
		await render(<App />);

		const heading = screen.getByRole("header", { name: "WAW Notes" });
		expect(heading).toBeOnTheScreen();
		expect(heading).toHaveTextContent("WAW Notes", { exact: true });
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
