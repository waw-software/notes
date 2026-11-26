import type { EditorAdapterProps } from "../contract";
import MilkdownEditor from "./MilkdownEditor.dom";

export default function MilkdownCandidate(
	props: EditorAdapterProps,
): React.JSX.Element {
	return <MilkdownEditor {...props} dom={{ style: { flex: 1 } }} />;
}
