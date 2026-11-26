import type { EditorAdapterProps } from "../contract";
import TiptapEditor from "./TiptapEditor.dom";

export default function TiptapCandidate(
	props: EditorAdapterProps,
): React.JSX.Element {
	return <TiptapEditor {...props} dom={{ style: { flex: 1 } }} />;
}
