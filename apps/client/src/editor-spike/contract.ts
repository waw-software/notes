export type EditorTrigger = Readonly<{ kind: "slash" | "link"; query: string }>;

export type EditorAdapterProps = Readonly<{
	/** Loaded once per mount; the screen remounts the editor to load other Markdown. */
	markdown: string;
	/** Called once after load with the editor's own serialization (no edits), then after each edit. */
	onChange: (markdown: string) => void;
	/** Called only for typed input, never on load or paste. */
	onTrigger: (trigger: EditorTrigger) => void;
}>;
