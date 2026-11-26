import type { ComponentType } from "react";
import type { EditorAdapterProps } from "./contract";

export type Candidate = Readonly<{
	id: string;
	label: string;
	Editor: ComponentType<EditorAdapterProps>;
}>;

export const candidates: readonly Candidate[] = [];
