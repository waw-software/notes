import type { EditorTrigger } from "./contract";
import { findTrigger } from "./trigger";

describe("findTrigger", () => {
	it.each<[string, EditorTrigger]>([
		["[[", { kind: "link", query: "" }],
		["see [[bud", { kind: "link", query: "bud" }],
		["[[a]] and [[b", { kind: "link", query: "b" }],
		["[[trip /pl", { kind: "link", query: "trip /pl" }],
	])("findTrigger: link trigger after [[", (textBeforeCaret, expected) => {
		expect(findTrigger(textBeforeCaret)).toEqual(expected);
	});

	it.each<[string, EditorTrigger]>([
		["/", { kind: "slash", query: "" }],
		["hello /", { kind: "slash", query: "" }],
		["/he", { kind: "slash", query: "he" }],
		["[[a]] /he", { kind: "slash", query: "he" }],
	])("findTrigger: slash trigger", (textBeforeCaret, expected) => {
		expect(findTrigger(textBeforeCaret)).toEqual(expected);
	});

	it.each(["[[a]]", "[[a]", "[", "[[a\nb", "a/b", "/ b", "//", ""])(
		"findTrigger: no trigger",
		(textBeforeCaret) => {
			expect(findTrigger(textBeforeCaret)).toBeNull();
		},
	);
});
