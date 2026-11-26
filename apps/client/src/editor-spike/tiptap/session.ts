import { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import type { EditorAdapterProps } from "../contract";
import { findTrigger } from "../trigger";
import { createExtensions } from "./extensions";

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
