import { remarkStringifyOptionsCtx } from "@milkdown/kit/core";
import type { Ctx, MilkdownPlugin, SliceType } from "@milkdown/kit/ctx";
import { extendListItemSchemaForTask } from "@milkdown/kit/preset/gfm";
import {
	DOMSerializer,
	Fragment,
	type Node,
	Slice,
} from "@milkdown/kit/prose/model";
import { Plugin } from "@milkdown/kit/prose/state";
import type { EditorView, NodeView } from "@milkdown/kit/prose/view";
import { $nodeSchema, $prose, $remark } from "@milkdown/kit/utils";
import type { EditorAdapterProps } from "../contract";
import { findTrigger } from "../trigger";

type PhrasingParent = Parameters<Parameters<Handle>[2]["containerPhrasing"]>[0];

/** The parts of an mdast table the writer reads; its handler types it `any`. */
type Table = {
	align?: ("left" | "center" | "right" | null)[] | null;
	children: { children: PhrasingParent[] }[];
};

type MdastNode = {
	type: string;
	value?: string;
	checked?: boolean | null;
	taskId?: string;
	children?: MdastNode[];
};

const TASK_ID = /(^| )\^([a-z0-9]+)$/;
const NOTE_LINK = /\[\[([^[\]\n]+)\]\]/g;

/** Moves the ` ^<id>` suffix of a checklist item's text into `taskId`. */
function takeTaskId(item: MdastNode) {
	const paragraph = item.children?.[0];
	const text = paragraph?.children?.at(-1);
	if (!paragraph?.children || text?.type !== "text" || !text.value) {
		return;
	}
	const match = TASK_ID.exec(text.value);
	// Without the space, only an item that is nothing but the id carries one.
	if (!match || (match[1] === "" && paragraph.children.length > 1)) {
		return;
	}
	item.taskId = match[2] as string;
	text.value = text.value.slice(0, match.index);
	if (text.value === "") {
		paragraph.children.pop();
	}
}

function splitNoteLinks(text: string): MdastNode[] {
	// `split` with one group alternates plain text and link titles.
	return text
		.split(NOTE_LINK)
		.map((value, index) => ({
			type: index % 2 === 1 ? "noteLink" : "text",
			value,
		}))
		.filter((node) => node.value !== "");
}

function transform(node: MdastNode) {
	if (node.type === "listItem" && typeof node.checked === "boolean") {
		takeTaskId(node);
	}
	if (node.children) {
		node.children = node.children.flatMap((child) => {
			if (child.type === "text" && child.value) {
				return splitNoteLinks(child.value);
			}
			transform(child);
			return [child];
		});
	}
}

// Task ids first: an item's id is in its last text node before that is split.
const remarkSpikeSyntax = $remark(
	"remarkSpikeSyntax",
	() => () => (tree: unknown) => transform(tree as MdastNode),
);

const taskListItemWithId = extendListItemSchemaForTask.extendSchema(
	(previous) => (ctx) => {
		const base = previous(ctx);
		return {
			...base,
			attrs: { ...base.attrs, taskId: { default: null } },
			parseDOM: (base.parseDOM ?? []).map((rule) => ({
				...rule,
				getAttrs: (dom: HTMLElement) => {
					const attrs = rule.getAttrs?.(dom as HTMLElement & string);
					return attrs === false
						? false
						: { ...attrs, taskId: dom.dataset.taskId ?? null };
				},
			})),
			toDOM: (node) => {
				const spec = base.toDOM?.(node) as [string, Record<string, unknown>, 0];
				return node.attrs.taskId === null
					? spec
					: [spec[0], { ...spec[1], "data-task-id": node.attrs.taskId }, 0];
			},
			parseMarkdown: {
				match: base.parseMarkdown.match,
				runner: (state, node, type) => {
					if (typeof node.taskId !== "string") {
						base.parseMarkdown.runner(state, node, type);
						return;
					}
					state.openNode(type, {
						label: node.label != null ? `${node.label}.` : "•",
						listType: node.label != null ? "ordered" : "bullet",
						spread: node.spread ?? true,
						checked: Boolean(node.checked),
						taskId: node.taskId,
					});
					state.next(node.children);
					state.closeNode();
				},
			},
			toMarkdown: {
				match: base.toMarkdown.match,
				runner: (state, node) => {
					base.toMarkdown.runner(state, withIdText(node));
				},
			},
		};
	},
);

/** A copy of the item whose own paragraph ends with its id, for serialization. */
function withIdText(item: Node): Node {
	const paragraph = item.firstChild;
	if (item.attrs.checked === null || item.attrs.taskId === null || !paragraph) {
		return item;
	}
	const separator = paragraph.content.size > 0 ? " " : "";
	const id = item.type.schema.text(`${separator}^${item.attrs.taskId}`);
	return item.copy(
		item.content.replaceChild(
			0,
			paragraph.copy(paragraph.content.append(Fragment.from(id))),
		),
	);
}

const noteLink = $nodeSchema("noteLink", () => ({
	group: "inline",
	inline: true,
	atom: true,
	attrs: { title: { default: "", validate: "string" } },
	parseDOM: [
		{
			tag: "a[data-note-link]",
			priority: 100,
			getAttrs: (dom) => ({ title: dom.textContent ?? "" }),
		},
	],
	toDOM: (node) => ["a", { "data-note-link": "" }, String(node.attrs.title)],
	leafText: (node) => String(node.attrs.title),
	parseMarkdown: {
		match: ({ type }) => type === "noteLink",
		runner: (state, node, type) => {
			state.addNode(type, { title: node.value as string });
		},
	},
	toMarkdown: {
		match: (node) => node.type.name === "noteLink",
		runner: (state, node) => {
			state.addNode("noteLink", undefined, String(node.attrs.title));
		},
	},
}));

type StringifyOptions =
	typeof remarkStringifyOptionsCtx extends SliceType<infer T, string>
		? T
		: never;
type Handle = NonNullable<NonNullable<StringifyOptions["handlers"]>["table"]>;

const DELIMITERS = { left: ":---", center: ":---:", right: "---:" };

/**
 * Unpadded columns with `---` delimiters. The GFM table writer cannot do this:
 * without pipe alignment it writes a single hyphen.
 */
const table: Handle = (node, _parent, state, info) => {
	const exitTable = state.enter("table");
	const rows = (node as Table).children.map((row) => {
		const cells = row.children.map((cell) => {
			// Inside `tableCell`, GFM escapes pipes.
			const exitCell = state.enter("tableCell");
			const exitPhrasing = state.enter("phrasing");
			const value = state.containerPhrasing(cell, {
				...info,
				before: " ",
				after: " ",
			});
			exitPhrasing();
			exitCell();
			return value.replace(/\r?\n/g, " ");
		});
		return `| ${cells.join(" | ")} |`;
	});
	const delimiters = ((node as Table).align ?? []).map((align) =>
		align ? DELIMITERS[align] : "---",
	);
	rows.splice(1, 0, `| ${delimiters.join(" | ")} |`);
	exitTable();
	return rows.join("\n");
};

/** The app's canonical Markdown style; pass to the editor's `config`. */
export function configureStringify(ctx: Ctx) {
	ctx.update(remarkStringifyOptionsCtx, (options) => ({
		...options,
		bullet: "-" as const,
		rule: "-" as const,
		emphasis: "*" as const,
		strong: "*" as const,
		listItemIndent: "one" as const,
		handlers: {
			...options.handlers,
			table,
			// Written as is: the default text handling would escape the brackets.
			noteLink: (node: MdastNode) => `[[${node.value}]]`,
		},
	}));
}

function taskIds(doc: Node) {
	const items = new Map<string, { node: Node; pos: number }[]>();
	doc.descendants((node, pos) => {
		const id: unknown = node.attrs.taskId;
		if (typeof id === "string") {
			items.set(id, [...(items.get(id) ?? []), { node, pos }]);
		}
	});
	return items;
}

/**
 * Splitting an item copies its attributes. When an edit duplicates an id, only
 * the first item that still has text keeps it.
 */
const uniqueTaskIds = $prose(
	() =>
		new Plugin({
			appendTransaction: (transactions, oldState, state) => {
				if (!transactions.some((tr) => tr.docChanged)) {
					return null;
				}
				const before = taskIds(oldState.doc);
				const tr = state.tr;
				for (const [id, items] of taskIds(state.doc)) {
					if (items.length <= Math.max(1, before.get(id)?.length ?? 0)) {
						continue;
					}
					const keeper =
						items.find(({ node }) => node.firstChild?.content.size) ?? items[0];
					for (const item of items) {
						if (item !== keeper) {
							tr.setNodeAttribute(item.pos, "taskId", null);
						}
					}
				}
				return tr.docChanged ? tr : null;
			},
		}),
);

function withoutTaskIds(content: Fragment): Fragment {
	const nodes: Node[] = [];
	content.forEach((node) => {
		const copy = node.isText ? node : node.copy(withoutTaskIds(node.content));
		nodes.push(
			typeof copy.attrs.taskId === "string"
				? copy.type.create(
						{ ...copy.attrs, taskId: null },
						copy.content,
						copy.marks,
					)
				: copy,
		);
	});
	return Fragment.fromArray(nodes);
}

/** Pasted content is a copy: the id stays with the item already in the note. */
const pasteWithoutTaskIds = $prose(
	() =>
		new Plugin({
			props: {
				transformPasted: (slice) =>
					new Slice(
						withoutTaskIds(slice.content),
						slice.openStart,
						slice.openEnd,
					),
			},
		}),
);

/** List items; a checklist item gets a checkbox that toggles `checked`. */
function listItemView(
	initial: Node,
	view: EditorView,
	getPos: () => number | undefined,
): NodeView {
	const toDOM = initial.type.spec.toDOM;
	if (!toDOM) {
		throw new Error("list_item has no toDOM");
	}
	const rendered = DOMSerializer.renderSpec(document, toDOM(initial));
	const dom = rendered.dom as HTMLElement;
	let contentDOM = rendered.contentDOM as HTMLElement;
	if (initial.attrs.checked !== null) {
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.checked = initial.attrs.checked === true;
		checkbox.contentEditable = "false";
		checkbox.addEventListener("change", () => {
			const pos = getPos();
			if (pos !== undefined) {
				view.dispatch(
					view.state.tr.setNodeAttribute(pos, "checked", checkbox.checked),
				);
			}
		});
		contentDOM = document.createElement("div");
		dom.append(checkbox, contentDOM);
	}
	return {
		dom,
		contentDOM,
		// New attributes rebuild the view; content changes stay in place.
		update: (node) =>
			node.hasMarkup(initial.type, initial.attrs, initial.marks),
		ignoreMutation: (mutation) =>
			mutation.type !== "selection" && !contentDOM.contains(mutation.target),
		stopEvent: (event) => event.target instanceof HTMLInputElement,
	};
}

const checklistView = $prose(
	() => new Plugin({ props: { nodeViews: { list_item: listItemView } } }),
);

/** `handleTextInput` sees typed text only, not paste or programmatic changes. */
function triggerPlugin(onTrigger: EditorAdapterProps["onTrigger"]) {
	return $prose(
		() =>
			new Plugin({
				props: {
					handleTextInput: (view, from, _to, text) => {
						const $from = view.state.doc.resolve(from);
						// A leaf must not read as typed text: `]` ends a link query.
						const before = $from.parent.textBetween(
							0,
							$from.parentOffset,
							undefined,
							(leaf) => (leaf.type.name === "hardbreak" ? "\n" : "]"),
						);
						const trigger = findTrigger(before + text);
						if (trigger) {
							onTrigger(trigger);
						}
						return false;
					},
				},
			}),
	);
}

/** Use after the `commonmark` and `gfm` presets. */
export function spikePlugins(
	onTrigger: EditorAdapterProps["onTrigger"],
): MilkdownPlugin[] {
	return [
		remarkSpikeSyntax,
		taskListItemWithId,
		noteLink,
		uniqueTaskIds,
		pasteWithoutTaskIds,
		checklistView,
		triggerPlugin(onTrigger),
	].flat();
}
