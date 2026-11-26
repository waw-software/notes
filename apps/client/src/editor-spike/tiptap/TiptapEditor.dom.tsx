"use dom";

import type { DOMProps } from "expo/dom";
import { useEffect, useRef } from "react";
import type { EditorAdapterProps } from "../contract";
import { createTiptapSession } from "./session";

// Colours and sizes from docs/DESIGN.md.
const STYLES = `
.tiptap-spike { height: 100%; overflow: auto; background: #FFFFFF; color: #171717;
	font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.tiptap-spike .ProseMirror { min-height: 100%; box-sizing: border-box; padding: 16px;
	outline: none; caret-color: #D4213D; }
.tiptap-spike img { max-width: 100%; }
.tiptap-spike a[data-note-link] { color: #B01A31; font-weight: 500;
	text-decoration: underline; text-underline-offset: 3px; }
.tiptap-spike blockquote { margin-left: 0; padding-left: 12px; color: #3D3D3D;
	border-left: 3px solid #D4213D; }
.tiptap-spike pre { padding: 12px; background: #F6F5F2; overflow: auto; }
.tiptap-spike table { border-collapse: collapse; }
.tiptap-spike th, .tiptap-spike td { border: 1px solid #E4E2DD; padding: 4px 8px; }
.tiptap-spike ul[data-type="taskList"] { padding-left: 0; list-style: none; }
.tiptap-spike li[data-checked] { display: flex; align-items: flex-start; }
.tiptap-spike li[data-checked] > label { display: flex; flex: none; align-items: center;
	justify-content: center; width: 44px; height: 44px; }
.tiptap-spike li[data-checked] > label > input { width: 22px; height: 22px; margin: 0;
	accent-color: #171717; }
.tiptap-spike li[data-checked] > div { flex: 1; }
.tiptap-spike li[data-checked] > div > p { margin: 10px 0; }
.tiptap-spike li[data-checked="true"] > div > p { color: #5C5C5C;
	text-decoration: line-through; }
`;

export default function TiptapEditor(
	props: EditorAdapterProps & { dom?: DOMProps },
): React.JSX.Element {
	const container = useRef<HTMLDivElement>(null);
	// The editor lives as long as the mount; its callbacks follow the latest props.
	const latest = useRef(props);
	latest.current = props;

	useEffect(() => {
		if (!container.current) {
			return;
		}
		const session = createTiptapSession(container.current, {
			markdown: latest.current.markdown,
			onChange: (markdown) => latest.current.onChange(markdown),
			onTrigger: (trigger) => latest.current.onTrigger(trigger),
		});
		return () => session.destroy();
	}, []);

	return (
		<>
			<style>{STYLES}</style>
			<div className="tiptap-spike" ref={container} />
		</>
	);
}
