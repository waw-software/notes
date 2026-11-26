/** -1 when equal; otherwise the index of the first differing UTF-16 code unit (the shorter length when one is a prefix). */
export function firstDifference(expected: string, actual: string): number {
	if (expected === actual) {
		return -1;
	}
	const shorter = Math.min(expected.length, actual.length);
	let index = 0;
	while (index < shorter && expected[index] === actual[index]) {
		index += 1;
	}
	return index;
}
