import { type Extensions, type JSONContent, Node } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import {
	Table,
	TableCell,
	TableHeader,
	TableRow,
} from "@tiptap/extension-table";
import { Markdown } from "@tiptap/markdown";
import { Fragment, type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { StarterKit } from "@tiptap/starter-kit";

/**
 * The hidden id at the end of a checklist item's line. The start of the text counts too:
 * an item whose text was deleted is written as `- [ ]  ^id` and read back as `^id`.
 */
const TASK_ID_SUFFIX = /(?:^| )\^([a-z0-9]+)$/;

const NOTE_LINK = /^\[\[([^[\]\n]+)\]\]/;

/** The default document, plus the final newline of the canonical style. */
const NoteDocument = Node.create({
	name: "doc",
	topNode: true,
	content: "block+",
	renderMarkdown: (node, h) =>
		node.content ? `${h.renderChildren(node.content, "\n\n")}\n` : "",
});

/** Moves a trailing ` ^<id>` from the item's text into its `taskId` attribute. */
function extractTaskId(item: JSONContent): JSONContent {
	const [paragraph, ...nested] = item.content ?? [];
	const inline = paragraph?.content ?? [];
	const last = inline.at(-1);
	const match =
		last?.type === "text" && !last.marks?.length
			? TASK_ID_SUFFIX.exec(last.text ?? "")
			: null;
	if (!match) {
		return item;
	}
	const text = last?.text?.slice(0, match.index);
	const kept = inline.slice(0, -1);
	return {
		...item,
		attrs: { ...item.attrs, taskId: match[1] },
		content: [
			{ ...paragraph, content: text ? [...kept, { ...last, text }] : kept },
			...nested,
		],
	};
}

/** Writes ` ^<id>` at the end of the item's own paragraph, where it is read from. */
function appendTaskId(item: JSONContent, taskId: string): JSONContent {
	const [paragraph, ...nested] = item.content ?? [];
	const suffix = { type: "text", text: ` ^${taskId}` };
	return {
		...item,
		content: [
			{ ...paragraph, content: [...(paragraph?.content ?? []), suffix] },
			...nested,
		],
	};
}

const NoteTaskItem = TaskItem.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			taskId: {
				default: null,
				keepOnSplit: false,
				parseHTML: (element) => element.getAttribute("data-task-id"),
				renderHTML: (attributes) =>
					attributes.taskId ? { "data-task-id": attributes.taskId } : {},
			},
		};
	},

	parseMarkdown(token, h) {
		return extractTaskId(this.parent?.(token, h) as JSONContent);
	},

	renderMarkdown(node, h, context) {
		const taskId = node.attrs?.taskId;
		const item = taskId ? appendTaskId(node, taskId) : node;
		return this.parent?.(item, h, context) ?? "";
	},
});

/** A copy of the pasted content without task ids: an id stays on the item that has it. */
export function withoutTaskIds(fragment: Fragment): Fragment {
	const nodes: ProseMirrorNode[] = [];
	fragment.forEach((node) => {
		if (node.isText) {
			nodes.push(node);
			return;
		}
		const attrs =
			node.type.name === NoteTaskItem.name
				? { ...node.attrs, taskId: null }
				: node.attrs;
		nodes.push(
			node.type.create(attrs, withoutTaskIds(node.content), node.marks),
		);
	});
	return Fragment.fromArray(nodes);
}

const SEPARATORS: Readonly<Record<string, string>> = {
	left: ":---",
	center: ":---:",
	right: "---:",
};

/** The library pads the columns; the canonical style has single spaces and no padding. */
const NoteTable = Table.extend({
	renderMarkdown: (node, h) => {
		const rows = (node.content ?? []).map((row) =>
			(row.content ?? []).map((cell) =>
				(cell.content ?? [])
					.map((block) => h.renderChildren(block))
					.join("\n")
					.trim()
					.replace(/[ \t]*\n/g, "<br>")
					.replace(/\\.|\|/g, (match) => (match === "|" ? "\\|" : match)),
			),
		);
		const [header, ...body] = rows;
		if (!header) {
			return "";
		}
		const separators = (node.content?.[0]?.content ?? []).map(
			(cell) => SEPARATORS[cell.attrs?.align] ?? "---",
		);
		return [header, separators, ...body]
			.map((cells) => `| ${cells.join(" | ")} |`)
			.join("\n");
	},
});

/** `[[Title]]`: a link to another note, shown as its title. */
const NoteLink = Node.create({
	name: "noteLink",
	group: "inline",
	inline: true,
	atom: true,

	addAttributes() {
		return {
			title: {
				default: "",
				parseHTML: (element) => element.getAttribute("data-title"),
				renderHTML: (attributes) => ({ "data-title": attributes.title }),
			},
		};
	},

	parseHTML() {
		return [{ tag: "a[data-note-link]" }];
	},

	renderHTML({ node, HTMLAttributes }) {
		return ["a", { ...HTMLAttributes, "data-note-link": "" }, node.attrs.title];
	},

	renderText({ node }) {
		return `[[${node.attrs.title}]]`;
	},

	markdownTokenizer: {
		name: "noteLink",
		level: "inline",
		start: "[[",
		tokenize: (source) => {
			const match = NOTE_LINK.exec(source);
			return match
				? { type: "noteLink", raw: match[0], title: match[1] }
				: undefined;
		},
	},

	parseMarkdown: (token, h) => h.createNode("noteLink", { title: token.title }),

	renderMarkdown: (node) => `[[${node.attrs?.title}]]`,
});

export function createExtensions(): Extensions {
	return [
		// The trailing node would add a paragraph the note's Markdown does not have.
		StarterKit.configure({ document: false, trailingNode: false }),
		NoteDocument,
		TaskList,
		NoteTaskItem.configure({ nested: true }),
		NoteTable,
		TableRow,
		TableHeader,
		TableCell,
		Image.configure({ allowBase64: true }),
		NoteLink,
		Markdown,
	];
}
