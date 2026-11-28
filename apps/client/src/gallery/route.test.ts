import { galleryRoute } from "./route";

describe("galleryRoute", () => {
	it("a web URL with ?screen=gallery-forms opens forms", () => {
		expect(galleryRoute("http://127.0.0.1:8090/?screen=gallery-forms")).toBe(
			"forms",
		);
	});

	it("the Electron URL opens forms", () => {
		expect(galleryRoute("waw-notes://app/?screen=gallery-forms")).toBe("forms");
	});

	it("the Expo Go deep link opens forms", () => {
		expect(galleryRoute("exp://127.0.0.1:8081/--/?screen=gallery-forms")).toBe(
			"forms",
		);
	});

	it("another parameter before it is allowed", () => {
		expect(
			galleryRoute("http://127.0.0.1:8090/?a=1&screen=gallery-forms"),
		).toBe("forms");
	});

	it("a fragment after the query is ignored", () => {
		expect(galleryRoute("http://127.0.0.1:8090/?screen=gallery-forms#x")).toBe(
			"forms",
		);
	});

	it("a screen parameter inside the fragment is not a query", () => {
		expect(
			galleryRoute("https://notes.example.com/#?screen=gallery-forms"),
		).toBeNull();
	});

	it("a section that does not exist yet gives null", () => {
		expect(
			galleryRoute("http://127.0.0.1:8090/?screen=gallery-lists"),
		).toBeNull();
	});

	it.each([
		"?screen=gallery-x",
		"?screen=gallery-",
		"?screen=gallery-forms-x",
		"?xscreen=gallery-forms",
	])("an unknown or partial name gives null: %s", (query) => {
		expect(galleryRoute(`http://127.0.0.1:8090/${query}`)).toBeNull();
	});

	it("no query gives null", () => {
		expect(galleryRoute("http://127.0.0.1:8090/")).toBeNull();
	});

	it("null gives null", () => {
		expect(galleryRoute(null)).toBeNull();
	});
});
