import type { EditorView } from "@tiptap/pm/view";
import type { EditorTrigger } from "../contract";
import { CANONICAL_FIXTURE } from "../fixture";
import { createTiptapSession, type TiptapSession } from "./session";

const sessions: TiptapSession[] = [];

afterEach(() => {
	for (const session of sessions.splice(0)) {
		session.destroy();
	}
	document.body.replaceChildren();
});

function open(markdown: string) {
	const element = document.createElement("div");
	document.body.append(element);
	const exports: string[] = [];
	const triggers: EditorTrigger[] = [];
	const session = createTiptapSession(element, {
		markdown,
		onChange: (next) => exports.push(next),
		onTrigger: (trigger) => triggers.push(trigger),
	});
	sessions.push(session);
	return { element, exports, triggers, view: session.view };
}

function type(view: EditorView, text: string): void {
	for (const character of text) {
		const { from, to } = view.state.selection;
		const insert = () => view.state.tr.insertText(character, from, to);
		const handled = view.someProp("handleTextInput", (handler) =>
			handler(view, from, to, character, insert),
		);
		if (!handled) {
			view.dispatch(insert());
		}
	}
}

function paste(view: EditorView, text: string): void {
	// jsdom has no ClipboardEvent, which `pasteText` would construct itself.
	view.pasteText(text, new Event("paste") as ClipboardEvent);
}

function pressEnter(view: EditorView): void {
	view.someProp("handleKeyDown", (handler) =>
		handler(view, new KeyboardEvent("keydown", { key: "Enter" })),
	);
}

/** Position of the paragraph holding exactly `text`, and of the end of its content. */
function findParagraph(view: EditorView, text: string) {
	let found: { start: number; end: number } | undefined;
	view.state.doc.descendants((node, position) => {
		if (node.type.name === "paragraph" && node.textContent === text) {
			found = { start: position, end: position + node.nodeSize - 1 };
		}
	});
	if (!found) {
		throw new Error(`No paragraph "${text}"`);
	}
	return found;
}

function placeCaret(view: EditorView, position: number): void {
	const Selection = view.state.selection.constructor as unknown as {
		near: (
			resolved: ReturnType<typeof view.state.doc.resolve>,
			bias: number,
		) => typeof view.state.selection;
	};
	view.dispatch(
		view.state.tr.setSelection(
			Selection.near(view.state.doc.resolve(position), -1),
		),
	);
}

function openEmptyParagraph() {
	const editor = open("");
	placeCaret(editor.view, 1);
	return editor;
}

function textsOf(element: Element, selector: string): (string | null)[] {
	return Array.from(
		element.querySelectorAll(selector),
		(node) => node.textContent,
	);
}

test("REQ-001 AC-02 tiptap: the first export of the canonical fixture is byte-identical", () => {
	const { exports } = open(CANONICAL_FIXTURE);

	expect(exports).toHaveLength(1);
	expect(exports[0]).toBe(CANONICAL_FIXTURE);
});

test("REQ-001 AC-02 tiptap: the export is the editor's own serialization", () => {
	const { exports } = open("* a\n");

	expect(exports).toEqual(["- a\n"]);
});

test("REQ-001 AC-01 tiptap: renders every fixture block with no Markdown syntax", () => {
	const { element } = open(CANONICAL_FIXTURE);

	expect(textsOf(element, "h1")).toEqual(["Trip plan"]);
	expect(textsOf(element, "strong")).toEqual(["bold"]);
	expect(textsOf(element, "em")).toEqual(["italic"]);
	expect(textsOf(element, "p code")).toEqual(["code"]);
	expect(
		element.querySelectorAll('ul:not([data-type="taskList"]) > li'),
	).toHaveLength(2);
	expect(element.querySelectorAll("ol > li")).toHaveLength(2);
	const checkboxes = element.querySelectorAll<HTMLInputElement>(
		'ul[data-type="taskList"] input[type="checkbox"]',
	);
	expect(Array.from(checkboxes, (box) => box.checked)).toEqual([false, true]);
	expect(textsOf(element, "blockquote")).toEqual(["Meet at noon."]);
	expect(element.querySelector("pre")?.textContent).toContain("Gate B");
	expect(textsOf(element, "table th, table td")).toEqual([
		"Item",
		"Price",
		"Rail",
		"12",
	]);
	expect(element.querySelector("img[alt]")?.getAttribute("src")).toMatch(
		/^data:image\/png;base64,/,
	);
	expect(element.querySelectorAll("hr")).toHaveLength(1);
	expect(textsOf(element, "[data-note-link]")).toEqual(["Budget"]);
	for (const syntax of [
		"#",
		"*",
		"`",
		"- [",
		"> ",
		"|",
		"---",
		"![",
		"[[",
		"]]",
		"^a1b2",
	]) {
		expect(element.textContent).not.toContain(syntax);
	}
});

test("REQ-001 AC-04 tiptap: the checklist id is not shown", () => {
	const { element } = open(CANONICAL_FIXTURE);
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const texts: string[] = [];
	while (walker.nextNode()) {
		texts.push(walker.currentNode.textContent ?? "");
	}

	expect(texts).toContain("Buy tickets");
	expect(texts.filter((text) => text.includes("a1b2"))).toEqual([]);
});

test("REQ-001 AC-03 tiptap: editing and toggling the linked item keeps its id", () => {
	const { exports, view } = open(CANONICAL_FIXTURE);

	placeCaret(view, findParagraph(view, "Buy tickets").end);
	type(view, " now");
	const item = findParagraph(view, "Buy tickets now").start - 1;
	view.dispatch(view.state.tr.setNodeAttribute(item, "checked", true));

	const last = exports.at(-1) ?? "";
	expect(last.split(" ^a1b2")).toHaveLength(2);
	expect(last.split("\n")).toContain("- [x] Buy tickets now ^a1b2");
});

test("REQ-001 AC-03 tiptap: Enter at the end of the linked item creates an item without an id", () => {
	const { exports, view } = open(CANONICAL_FIXTURE);

	placeCaret(view, findParagraph(view, "Buy tickets").end);
	pressEnter(view);
	type(view, "Pay");

	const last = exports.at(-1) ?? "";
	expect(last).toContain(
		"\n\n- [ ] Buy tickets ^a1b2\n- [ ] Pay\n- [x] Check dates\n\n",
	);
	expect(last.split(" ^a1b2")).toHaveLength(2);
	expect(open(last).exports).toEqual([last]);
});

test("tiptap: typing / raises a slash trigger", () => {
	const { triggers, view } = openEmptyParagraph();

	type(view, "/");

	expect(triggers).toEqual([{ kind: "slash", query: "" }]);
});

test("tiptap: typing [[ raises a link trigger on the second bracket and then the query", () => {
	const { triggers, view } = openEmptyParagraph();

	type(view, "[");
	expect(triggers).toEqual([]);
	type(view, "[");
	expect(triggers).toEqual([{ kind: "link", query: "" }]);
	type(view, "budget");

	expect(triggers.at(-1)).toEqual({ kind: "link", query: "budget" });
});

test("tiptap: loading and pasting raise no trigger", () => {
	const { exports, triggers, view } = open(CANONICAL_FIXTURE);

	placeCaret(view, findParagraph(view, "Meet at noon.").end);
	paste(view, "x /");
	paste(view, "[[budget");

	expect(exports.at(-1)).toContain("budget");
	expect(triggers).toEqual([]);
});

test("REQ-001 AC-04 tiptap: a linked item emptied of its text keeps the id hidden after a remount", () => {
	const { exports, view } = open("- [ ] Buy ^a1b2\n");
	const { start, end } = findParagraph(view, "Buy");
	view.dispatch(view.state.tr.delete(start + 1, end));
	const emptied = exports.at(-1) ?? "";

	const reopened = open(emptied);

	expect(reopened.element.textContent).not.toContain("a1b2");
	expect(reopened.exports).toEqual([emptied]);
	expect(emptied).toContain("^a1b2");
});
