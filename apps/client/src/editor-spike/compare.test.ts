import { firstDifference } from "./compare";

describe("compare", () => {
	it.each([
		["abc", "abc", -1],
		["abc", "abd", 2],
		["ab", "abc", 2],
		["abc", "ab", 2],
		["", "", -1],
		["a\n", "a", 1],
	])("firstDifference(%j, %j) is %i", (expected, actual, index) => {
		expect(firstDifference(expected, actual)).toBe(index);
	});
});
