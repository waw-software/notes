import { Editor } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import type { EditorAdapterProps } from "../contract";
import { findTrigger } from "../trigger";
import { createExtensions, withoutTaskIds } from "./extensions";

export type TiptapSession = Readonly<{
	view: EditorView;
	destroy: () => void;
}>;

export function createTiptapSession(
	element: HTMLElement,
	props: EditorAdapterProps,
): TiptapSession {
	const editor = new Editor({
		element,
		extensions: createExtensions(),
		content: props.markdown,
		contentType: "markdown",
		editorProps: {
			// Runs for paste and drop. Moving an item by dragging keeps its id.
			transformPasted: (slice, view) =>
				view.dragging?.move
					? slice
					: new Slice(
							withoutTaskIds(slice.content),
							slice.openStart,
							slice.openEnd,
						),
			// ProseMirror calls this for typed text only, not for paste or commands.
			handleTextInput: (view, from, _to, text) => {
				const $from = view.state.doc.resolve(from);
				const before = $from.parent.textBetween(
					0,
					$from.parentOffset,
					undefined,
					"￼",
				);
				const trigger = findTrigger(before + text);
				if (trigger) {
					props.onTrigger(trigger);
				}
				return false;
			},
		},
		onUpdate: ({ editor: updated }) => props.onChange(updated.getMarkdown()),
	});
	props.onChange(editor.getMarkdown());
	return { view: editor.view, destroy: () => editor.destroy() };
}
