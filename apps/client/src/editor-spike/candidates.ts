import type { ComponentType } from "react";
import type { EditorAdapterProps } from "./contract";
import MilkdownCandidate from "./milkdown/MilkdownCandidate";
import TiptapCandidate from "./tiptap/TiptapCandidate";

export type Candidate = Readonly<{
	id: string;
	label: string;
	Editor: ComponentType<EditorAdapterProps>;
}>;

export const candidates: readonly Candidate[] = [
	{ id: "tiptap", label: "Tiptap", Editor: TiptapCandidate },
	{ id: "milkdown", label: "Milkdown", Editor: MilkdownCandidate },
];
