import { render, screen } from "@testing-library/react-native";
import App from "./App";

describe("App", () => {
	it("renders the WAW Notes heading", async () => {
		await render(<App />);

		const heading = screen.getByRole("header", { name: "WAW Notes" });
		expect(heading).toBeOnTheScreen();
		expect(heading).toHaveTextContent("WAW Notes", { exact: true });
	});
});
