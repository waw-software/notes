import { fireEvent, render, screen } from "@testing-library/react-native";
import { TextInput } from "../ui/TextInput";
import GalleryForms from "./GalleryForms";

// Records the props each field passes on; the real component still renders.
// Both layouts look the same in PR 1, so only the prop tells them apart.
jest.mock("../ui/TextInput", () => {
	const actual = jest.requireActual("../ui/TextInput");
	return { TextInput: jest.fn(actual.TextInput) };
});

function selected(name: string) {
	return screen.getByRole("button", { name }).props.accessibilityState.selected;
}

// One entry per field on the first render: nothing re-renders without input.
function fieldLayouts() {
	return jest.mocked(TextInput).mock.calls.map(([props]) => props.layout);
}

describe("GalleryForms", () => {
	beforeEach(() => {
		jest.mocked(TextInput).mockClear();
	});

	it("mobile shows the Connect fields and both buttons", async () => {
		await render(<GalleryForms layout="mobile" />);

		expect(screen.getAllByLabelText("Server URL")).toHaveLength(2);
		expect(screen.getByLabelText("Access token")).toBeOnTheScreen();
		expect(screen.getAllByRole("button", { name: "Connect" })).toHaveLength(2);
		expect(
			screen.getByRole("button", { name: "Scan QR code" }),
		).toBeOnTheScreen();
		expect(screen.getByText("Enter the server address.")).toBeOnTheScreen();
	});

	it("mobile pills: Everywhere starts selected and pressing Home selects it", async () => {
		await render(<GalleryForms layout="mobile" />);

		expect(selected("Everywhere")).toBe(true);
		expect(selected("Home")).toBe(false);
		expect(selected("#renovation")).toBe(false);

		await fireEvent.press(screen.getByRole("button", { name: "Home" }));

		expect(selected("Everywhere")).toBe(false);
		expect(selected("Home")).toBe(true);
		expect(selected("#renovation")).toBe(false);
	});

	it("desktop shows the pairing-link field and the disabled, helper and error states", async () => {
		await render(<GalleryForms layout="desktop" />);

		expect(
			screen.getByLabelText("Server URL or pairing link"),
		).toBeOnTheScreen();
		expect(
			screen.getAllByRole("button", { name: "Connect", disabled: true }),
		).toHaveLength(1);
		expect(
			screen.getByText("Paste the address from the server's setup page."),
		).toBeOnTheScreen();
		expect(screen.getByText("Enter the server address.")).toBeOnTheScreen();
		expect(
			screen
				.getAllByLabelText("Access token")
				.map((field) => field.props.editable),
		).toEqual([true, false]);
		expect(screen.queryByRole("button", { name: "Scan QR code" })).toBeNull();
	});

	it("every mobile field gets layout mobile", async () => {
		await render(<GalleryForms layout="mobile" />);

		expect(fieldLayouts()).toEqual(["mobile", "mobile", "mobile"]);
	});

	it("every desktop field gets layout desktop", async () => {
		await render(<GalleryForms layout="desktop" />);

		expect(fieldLayouts()).toEqual([
			"desktop",
			"desktop",
			"desktop",
			"desktop",
			"desktop",
		]);
	});
});
