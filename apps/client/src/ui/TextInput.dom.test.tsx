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

	it("the live region is present before an error and carries the error after it appears", async () => {
		await renderToken();

		const region = container.querySelector('[aria-live="polite"]');

		expect(region?.textContent).toBe("");

		await renderToken("Enter the server address.");

		expect(region?.isConnected).toBe(true);
		expect(region?.textContent).toBe("Enter the server address.");
	});

	function description(input: Element | null | undefined) {
		const id = input?.getAttribute("aria-describedby");
		return id ? document.getElementById(id)?.textContent : undefined;
	}

	it("an error is the input's description", async () => {
		await renderToken("Enter the server address.");

		expect(description(container.querySelector("input"))).toBe(
			"Enter the server address.",
		);
	});

	it("helper text is the description when there is no error", async () => {
		await act(async () =>
			root.render(
				<TextInput
					label="Access token"
					value=""
					onValueChange={() => {}}
					helperText="Paste the token from your server."
				/>,
			),
		);

		expect(description(container.querySelector("input"))).toBe(
			"Paste the token from your server.",
		);
	});

	it("no helper and no error gives no description", async () => {
		await renderToken();

		expect(
			container.querySelector("input")?.hasAttribute("aria-describedby"),
		).toBe(false);
	});

	it("two inputs side by side get different description ids", async () => {
		await act(async () =>
			root.render(
				<>
					<TextInput
						label="Server URL"
						value=""
						onValueChange={() => {}}
						helperText="Use the address of your server."
					/>
					<TextInput
						label="Access token"
						value=""
						onValueChange={() => {}}
						helperText="Paste the token from your server."
					/>
				</>,
			),
		);

		const [first, second] = Array.from(container.querySelectorAll("input"));

		expect(description(first)).toBe("Use the address of your server.");
		expect(description(second)).toBe("Paste the token from your server.");
		expect(first?.getAttribute("aria-describedby")).not.toBe(
			second?.getAttribute("aria-describedby"),
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
