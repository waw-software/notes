import type { ComponentType } from "react";
import type { EditorAdapterProps } from "./contract";
import MilkdownCandidate from "./milkdown/MilkdownCandidate";

export type Candidate = Readonly<{
	id: string;
	label: string;
	Editor: ComponentType<EditorAdapterProps>;
}>;

export const candidates: readonly Candidate[] = [
	{ id: "milkdown", label: "Milkdown", Editor: MilkdownCandidate },
];
