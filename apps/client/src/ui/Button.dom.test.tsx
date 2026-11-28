import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button } from "./Button";

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

describe("Button on web", () => {
	it("a button renders role=button named by its label", async () => {
		await act(async () =>
			root.render(
				<Button variant="primary" label="Connect" onPress={() => {}} />,
			),
		);

		const button = container.querySelector('[role="button"]');
		expect(button?.getAttribute("aria-label")).toBe("Connect");
		expect(button?.textContent).toBe("Connect");
	});

	it("a disabled button sets aria-disabled", async () => {
		await act(async () =>
			root.render(
				<Button
					variant="primary"
					label="Connect"
					disabled
					onPress={() => {}}
				/>,
			),
		);

		const button = container.querySelector('[role="button"]');
		expect(button?.getAttribute("aria-disabled")).toBe("true");
	});

	it("an enabled button has no aria-disabled true", async () => {
		await act(async () =>
			root.render(
				<Button variant="primary" label="Connect" onPress={() => {}} />,
			),
		);

		const button = container.querySelector('[role="button"]');
		expect(button).not.toBeNull();
		expect(button?.getAttribute("aria-disabled")).not.toBe("true");
	});
});
