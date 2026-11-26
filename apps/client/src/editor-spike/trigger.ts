import type { EditorTrigger } from "./contract";

const SLASH_AT_CARET = /(?:^|\s)\/([^\s/]*)$/;

/** `textBeforeCaret` is the text of the current text block up to the caret. */
export function findTrigger(textBeforeCaret: string): EditorTrigger | null {
	const linkStart = textBeforeCaret.lastIndexOf("[[");
	if (linkStart !== -1) {
		const query = textBeforeCaret.slice(linkStart + 2);
		if (!/[\]\n]/.test(query)) {
			return { kind: "link", query };
		}
	}
	const query = SLASH_AT_CARET.exec(textBeforeCaret)?.[1];
	return query === undefined ? null : { kind: "slash", query };
}
