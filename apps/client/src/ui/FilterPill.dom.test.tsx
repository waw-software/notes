import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FilterPill } from "./FilterPill";

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

async function renderPill(selected: boolean, emoji?: string) {
	await act(async () =>
		root.render(
			<FilterPill
				label="Home"
				selected={selected}
				onPress={() => {}}
				{...(emoji === undefined ? {} : { emoji })}
			/>,
		),
	);
	return container.querySelector('[role="button"]');
}

describe("FilterPill on web", () => {
	it("selected pill renders aria-pressed=true and its label as aria-label", async () => {
		const pill = await renderPill(true);

		expect(pill?.getAttribute("aria-pressed")).toBe("true");
		expect(pill?.getAttribute("aria-label")).toBe("Home");
	});

	it("unselected pill renders aria-pressed=false", async () => {
		const pill = await renderPill(false);

		expect(pill?.getAttribute("aria-pressed")).toBe("false");
	});

	it("the emoji is hidden from assistive technology", async () => {
		const pill = await renderPill(false, "🏠");

		const hidden = pill?.querySelector('[aria-hidden="true"]');
		expect(hidden?.textContent).toBe("🏠");
		expect(pill?.getAttribute("aria-label")).toBe("Home");
	});
});
