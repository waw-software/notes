import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TextInput } from "./TextInput";

let container: HTMLElement;
let root: Root;

beforeEach(() => {
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

async function renderToken(errorText?: string) {
	await act(async () =>
		root.render(
			<TextInput
				label="Access token"
				value="fixture-token"
				onValueChange={() => {}}
				kind="token"
				{...(errorText ? { errorText } : {})}
			/>,
		),
	);
}

describe("TextInput on web", () => {
	it("the error text is a polite live region", async () => {
		await renderToken("Enter a valid access token.");

		expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
			"Enter a valid access token.",
		);
	});

	it("the input is labelled by its label", async () => {
		await renderToken();

		expect(container.querySelector("input")?.getAttribute("aria-label")).toBe(
			"Access token",
		);
	});

	it("a token field renders a password input", async () => {
		await renderToken();

		expect(container.querySelector('input[type="password"]')).not.toBeNull();
	});
});
