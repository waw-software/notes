import { TextSelection } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import type { EditorTrigger } from "../contract";
import { CANONICAL_FIXTURE } from "../fixture";
import { createMilkdownSession, type MilkdownSession } from "./session";

const sessions: MilkdownSession[] = [];

afterEach(() => {
	for (const session of sessions.splice(0)) {
		session.destroy();
	}
	document.body.replaceChildren();
});

async function load(markdown: string) {
	const element = document.createElement("div");
	document.body.append(element);
	const exports: string[] = [];
	const triggers: EditorTrigger[] = [];
	const session = await createMilkdownSession(element, {
		markdown,
		onChange: (next) => exports.push(next),
		onTrigger: (trigger) => triggers.push(trigger),
	});
	sessions.push(session);
	return { element, view: session.view, exports, triggers };
}

function type(view: EditorView, text: string) {
	for (const character of text) {
		const { from, to } = view.state.selection;
		const insert = () => view.state.tr.insertText(character, from, to);
		const handled = view.someProp("handleTextInput", (handle) =>
			handle(view, from, to, character, insert),
		);
		if (!handled) {
			view.dispatch(insert());
		}
	}
}

function paste(view: EditorView, text: string) {
	// jsdom has no ClipboardEvent, which ProseMirror would construct.
	view.pasteText(text, new Event("paste") as ClipboardEvent);
}

/** The position of the first text node containing `text`, and the node's end. */
function findText(view: EditorView, text: string) {
	let found: { start: number; end: number } | undefined;
	view.state.doc.descendants((node, pos) => {
		if (!found && node.isText && node.text?.includes(text)) {
			found = { start: pos, end: pos + node.nodeSize };
		}
	});
	if (!found) {
		throw new Error(`no text ${text}`);
	}
	return found;
}

function setCaret(view: EditorView, position: number) {
	view.dispatch(
		view.state.tr.setSelection(TextSelection.create(view.state.doc, position)),
	);
}

function pressEnter(view: EditorView) {
	const event = new KeyboardEvent("keydown", { key: "Enter" });
	view.someProp("handleKeyDown", (handle) => handle(view, event));
}

function textOf(element: Element, selector: string) {
	return Array.from(element.querySelectorAll(selector), (found) =>
		found.textContent?.trim(),
	);
}

test("REQ-001 AC-02 milkdown: the first export of the canonical fixture is byte-identical", async () => {
	const { exports } = await load(CANONICAL_FIXTURE);

	expect(exports[0]).toBe(CANONICAL_FIXTURE);
	expect(exports).toHaveLength(1);
});

test("REQ-001 AC-02 milkdown: the export is the editor's own serialization", async () => {
	const { exports } = await load("* a\n");

	expect(exports).toEqual(["- a\n"]);
});

test("REQ-001 AC-01 milkdown: renders every fixture block with no Markdown syntax", async () => {
	const { element } = await load(CANONICAL_FIXTURE);

	expect(textOf(element, "h1")).toEqual(["Trip plan"]);
	expect(textOf(element, "strong")).toEqual(["bold"]);
	expect(textOf(element, "em")).toEqual(["italic"]);
	expect(textOf(element, "p > code")).toEqual(["code"]);
	expect(element.querySelector("ul")?.children).toHaveLength(2);
	expect(element.querySelector("ol")?.children).toHaveLength(2);
	const tasks = element.querySelectorAll('li[data-item-type="task"]');
	expect(textOf(element, 'li[data-item-type="task"]')).toEqual([
		"Buy tickets",
		"Check dates",
	]);
	expect(
		Array.from(
			tasks,
			(task) =>
				task.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked,
		),
	).toEqual([false, true]);
	expect(textOf(element, "blockquote")).toEqual(["Meet at noon."]);
	expect(element.querySelector("pre")?.textContent).toContain("Gate B");
	expect(textOf(element, "table th, table td")).toEqual([
		"Item",
		"Price",
		"Rail",
		"12",
	]);
	expect(
		element.querySelector("img[alt='Diagram']")?.getAttribute("src"),
	).toMatch(/^data:image\/png;base64,/);
	expect(element.querySelectorAll("hr")).toHaveLength(1);
	expect(textOf(element, "[data-note-link]")).toEqual(["Budget"]);
	for (const syntax of [
		"#",
		"**",
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

test("REQ-001 AC-04 milkdown: the checklist id is not shown", async () => {
	const { element } = await load(CANONICAL_FIXTURE);

	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const texts: string[] = [];
	while (walker.nextNode()) {
		texts.push(walker.currentNode.textContent ?? "");
	}
	expect(texts).toContain("Buy tickets");
	expect(texts.filter((text) => text.includes("a1b2"))).toEqual([]);
});

test("REQ-001 AC-03 milkdown: editing and toggling the linked item keeps its id", async () => {
	const { element, view, exports } = await load(CANONICAL_FIXTURE);

	setCaret(view, findText(view, "Buy tickets").end);
	type(view, " now");
	element
		.querySelector<HTMLInputElement>('li[data-item-type="task"] input')
		?.click();

	const last = exports.at(-1) ?? "";
	expect(last.split(" ^a1b2")).toHaveLength(2);
	expect(last.split("\n")).toContain("- [x] Buy tickets now ^a1b2");
});

test("REQ-001 AC-03 milkdown: Enter at the end of the linked item creates an item without an id", async () => {
	const { view, exports } = await load(CANONICAL_FIXTURE);

	setCaret(view, findText(view, "Buy tickets").end);
	pressEnter(view);
	type(view, "Pay");

	const last = exports.at(-1) ?? "";
	expect(last).toContain(
		"\n- [ ] Buy tickets ^a1b2\n- [ ] Pay\n- [x] Check dates\n",
	);
	expect(last.split("^a1b2")).toHaveLength(2);
	const reloaded = await load(last);
	expect(reloaded.exports).toEqual([last]);
});

test("REQ-001 AC-03 milkdown: Enter at the start of the linked item keeps the id with its text", async () => {
	const { view, exports } = await load(CANONICAL_FIXTURE);

	setCaret(view, findText(view, "Buy tickets").start);
	pressEnter(view);

	const last = exports.at(-1) ?? "";
	expect(last.split("^a1b2")).toHaveLength(2);
	expect(last).toContain("- [ ] Buy tickets ^a1b2\n");
});

test("REQ-001 AC-03 milkdown: pasting a copy of the linked item leaves the id only on the original", async () => {
	const { view, exports } = await load(CANONICAL_FIXTURE);
	const textStart = findText(view, "Buy tickets").start;
	// The caret sits in the item's paragraph; the item starts two levels up.
	const $text = view.state.doc.resolve(textStart);
	const copied = view.serializeForClipboard(
		view.state.doc.slice($text.before(-1), $text.after(-1)),
	).dom.innerHTML;
	expect(copied).toContain('data-task-id="a1b2"');

	setCaret(view, textStart);
	view.pasteHTML(copied, new Event("paste") as ClipboardEvent);

	const last = exports.at(-1) ?? "";
	expect(last.split("^a1b2")).toHaveLength(2);
	expect(last).toContain(
		"\n- [ ] Buy tickets\n- [ ] Buy tickets ^a1b2\n- [x] Check dates\n",
	);
});

test("REQ-001 AC-03 AC-04 milkdown: a line break in the linked item keeps the id hidden and attached", async () => {
	const { view, exports } = await load(CANONICAL_FIXTURE);
	const insertBreak = () => {
		const hardbreak = view.state.schema.nodes.hardbreak?.create();
		if (!hardbreak) {
			throw new Error("no hardbreak node");
		}
		view.dispatch(view.state.tr.replaceSelectionWith(hardbreak, false));
	};
	const expectHiddenAfterReload = async (markdown: string) => {
		const reloaded = await load(markdown);
		expect(reloaded.element.textContent).not.toContain("a1b2");
		expect(reloaded.exports).toEqual([markdown]);
	};

	setCaret(view, findText(view, "Buy tickets").end);
	insertBreak();
	// A break with nothing after it yet.
	await expectHiddenAfterReload(exports.at(-1) ?? "");
	type(view, "at the station");

	const last = exports.at(-1) ?? "";
	expect(last).toContain("- [ ] Buy tickets\\\n  at the station ^a1b2\n");
	await expectHiddenAfterReload(last);
});

test("REQ-001 AC-03 milkdown: an item emptied of its text keeps its id across a reload", async () => {
	const { element, view, exports } = await load("- [ ] Buy ^a1b2\n");
	const { start, end } = findText(view, "Buy");

	view.dispatch(view.state.tr.delete(start, end));
	const emptied = exports.at(-1) ?? "";
	const reloaded = await load(emptied);

	expect(reloaded.exports).toEqual([emptied]);
	expect(reloaded.element.textContent).toBe("");
	expect(element.textContent).toBe("");
});

test("milkdown: typing / raises a slash trigger", async () => {
	const { view, triggers } = await load("");

	type(view, "/");

	expect(triggers).toEqual([{ kind: "slash", query: "" }]);
	expect(view.state.doc.textContent).toBe("/");
});

test("milkdown: typing [[ raises a link trigger on the second bracket and then the query", async () => {
	const { view, triggers } = await load("");

	type(view, "[");
	expect(triggers).toEqual([]);
	type(view, "[");
	expect(triggers).toEqual([{ kind: "link", query: "" }]);
	type(view, "budget");

	expect(triggers.at(-1)).toEqual({ kind: "link", query: "budget" });
});

test("milkdown: loading and pasting raise no trigger", async () => {
	const { view, triggers, exports } = await load(CANONICAL_FIXTURE);

	setCaret(view, findText(view, "Meet at noon.").end);
	paste(view, "x /");
	paste(view, "[[budget");

	expect(view.state.doc.textContent).toContain("Meet at noon.x /[[budget");
	expect(exports.length).toBeGreaterThan(1);
	expect(triggers).toEqual([]);
});
