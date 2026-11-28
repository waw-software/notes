import { render, screen } from "@testing-library/react-native";
import { Dimensions } from "react-native";
import Gallery from "./Gallery";

function setWindow(width: number, height: number) {
	const size = { width, height, scale: 2, fontScale: 1 };
	Dimensions.set({ window: size, screen: size });
}

describe("Gallery", () => {
	const initialWindow = Dimensions.get("window");
	const initialScreen = Dimensions.get("screen");

	afterEach(() => {
		Dimensions.set({ window: initialWindow, screen: initialScreen });
	});

	it("390 wide shows the mobile forms", async () => {
		setWindow(390, 844);
		await render(<Gallery section="forms" />);

		expect(
			screen.getByRole("button", { name: "Scan QR code" }),
		).toBeOnTheScreen();
		expect(screen.queryByLabelText("Server URL or pairing link")).toBeNull();
	});

	it("699 wide is still mobile", async () => {
		setWindow(699, 844);
		await render(<Gallery section="forms" />);

		expect(
			screen.getByRole("button", { name: "Scan QR code" }),
		).toBeOnTheScreen();
	});

	it("700 wide is desktop", async () => {
		setWindow(700, 844);
		await render(<Gallery section="forms" />);

		expect(
			screen.getByLabelText("Server URL or pairing link"),
		).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Scan QR code" })).toBeNull();
	});

	it("1440 wide is desktop", async () => {
		setWindow(1440, 844);
		await render(<Gallery section="forms" />);

		expect(
			screen.getByLabelText("Server URL or pairing link"),
		).toBeOnTheScreen();
	});
});
