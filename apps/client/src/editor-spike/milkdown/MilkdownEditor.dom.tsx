"use dom";

import type { DOMProps } from "expo/dom";
import { useEffect, useRef } from "react";
import type { EditorAdapterProps } from "../contract";
import { createMilkdownSession, type MilkdownSession } from "./session";

// DESIGN.md §2, as literals; the first rules are the ones ProseMirror needs.
const STYLES = `
.milkdown-spike .ProseMirror { position: relative; white-space: pre-wrap; overflow-wrap: break-word; font-variant-ligatures: none; outline: none; min-height: 100%; padding: 16px; box-sizing: border-box; caret-color: #D4213D; }
.milkdown-spike { color: #171717; background: #FFFFFF; font: 16px/26px Inter, system-ui, sans-serif; }
.milkdown-spike h1 { font: 600 28px/34px "Space Grotesk", Inter, system-ui, sans-serif; }
.milkdown-spike pre, .milkdown-spike code { font-family: ui-monospace, Menlo, monospace; background: #F6F5F2; }
.milkdown-spike pre { padding: 12px; overflow-x: auto; }
.milkdown-spike blockquote { margin-left: 0; padding-left: 12px; border-left: 3px solid #D4213D; }
.milkdown-spike table { border-collapse: collapse; }
.milkdown-spike th, .milkdown-spike td { border: 1px solid #E4E2DD; padding: 4px 12px; text-align: left; }
.milkdown-spike th p, .milkdown-spike td p { margin: 0; }
.milkdown-spike img { max-width: 100%; }
.milkdown-spike hr { border: 0; border-top: 1px solid #E4E2DD; }
.milkdown-spike a[data-note-link] { color: #B01A31; text-decoration: underline; }
.milkdown-spike li[data-item-type="task"] { display: flex; align-items: flex-start; gap: 10px; min-height: 44px; list-style: none; }
.milkdown-spike li[data-item-type="task"] > input { flex: none; width: 20px; height: 20px; margin: 3px 0; accent-color: #171717; }
.milkdown-spike li[data-item-type="task"] > div { flex: 1; min-width: 0; }
.milkdown-spike li[data-item-type="task"] p { margin: 0; }
`;

export default function MilkdownEditor(
	props: EditorAdapterProps & { dom?: DOMProps },
): React.JSX.Element {
	const host = useRef<HTMLDivElement>(null);
	const latest = useRef(props);
	latest.current = props;

	useEffect(() => {
		// One element per mount, so a late editor never shares it with the next.
		const element = document.createElement("div");
		element.style.height = "100%";
		host.current?.append(element);
		let unmounted = false;
		let session: MilkdownSession | undefined;
		void createMilkdownSession(element, {
			markdown: latest.current.markdown,
			onChange: (markdown) => {
				if (!unmounted) {
					latest.current.onChange(markdown);
				}
			},
			onTrigger: (trigger) => latest.current.onTrigger(trigger),
		}).then((created) => {
			if (unmounted) {
				created.destroy();
			} else {
				session = created;
			}
		});
		return () => {
			unmounted = true;
			session?.destroy();
			element.remove();
		};
	}, []);

	return (
		<>
			<style>{STYLES}</style>
			<div
				ref={host}
				className="milkdown-spike"
				style={{ flex: 1, height: "100%", overflow: "auto" }}
			/>
		</>
	);
}
