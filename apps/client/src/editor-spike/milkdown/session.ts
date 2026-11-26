import {
	defaultValueCtx,
	Editor,
	editorViewCtx,
	rootCtx,
} from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { gfm } from "@milkdown/kit/preset/gfm";
import { Plugin } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $prose, getMarkdown } from "@milkdown/kit/utils";
import type { EditorAdapterProps } from "../contract";
import { configureStringify, spikePlugins } from "./plugins";

export type MilkdownSession = Readonly<{
	view: EditorView;
	destroy: () => void;
}>;

export async function createMilkdownSession(
	element: HTMLElement,
	props: EditorAdapterProps,
): Promise<MilkdownSession> {
	let report: (() => void) | undefined;
	// Not the listener plugin: it reports after a 200 ms debounce.
	const changes = $prose(
		() =>
			new Plugin({
				view: () => ({
					update: (view, previous) => {
						if (!view.state.doc.eq(previous.doc)) {
							report?.();
						}
					},
				}),
			}),
	);
	const editor = await Editor.make()
		.config((ctx) => {
			ctx.set(rootCtx, element);
			ctx.set(defaultValueCtx, props.markdown);
			configureStringify(ctx);
		})
		.use(commonmark)
		.use(gfm)
		.use(spikePlugins(props.onTrigger))
		.use(changes)
		.create();
	report = () => props.onChange(editor.action(getMarkdown()));
	report();
	return {
		view: editor.action((ctx) => ctx.get(editorViewCtx)),
		destroy: () => {
			report = undefined;
			void editor.destroy();
		},
	};
}
