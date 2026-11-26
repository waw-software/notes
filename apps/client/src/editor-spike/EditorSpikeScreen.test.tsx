import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import type { Candidate } from "./candidates";
import type { EditorAdapterProps } from "./contract";
import EditorSpikeScreen from "./EditorSpikeScreen";
import { CANONICAL_FIXTURE, NONCANONICAL_SAMPLE } from "./fixture";

function useExport(onChange: EditorAdapterProps["onChange"], value: string) {
	useEffect(() => {
		onChange(value);
	}, [onChange, value]);
}

function UnchangedEditor({ markdown, onChange }: EditorAdapterProps) {
	useExport(onChange, markdown);
	return null;
}

function RestylingEditor({ markdown, onChange }: EditorAdapterProps) {
	useExport(onChange, markdown.replace("**bold**", "__bold__"));
	return null;
}

/** The props of each mount of SilentEditor, in mount order. */
const mounts: EditorAdapterProps[] = [];

/** Reports nothing by itself: the test calls the callbacks of the mount it wants. */
function SilentEditor(props: EditorAdapterProps) {
	const [initial] = useState(props);
	useEffect(() => {
		mounts.push(initial);
	}, [initial]);
	return null;
}

function FirstNamedEditor({ markdown }: EditorAdapterProps) {
	return <Text testID="editor">{`one:${markdown}`}</Text>;
}

function SecondNamedEditor({ markdown }: EditorAdapterProps) {
	return <Text testID="editor">{`two:${markdown}`}</Text>;
}

function only(Editor: Candidate["Editor"]): Candidate[] {
	return [{ id: "fake", label: "Fake", Editor }];
}

describe("EditorSpikeScreen", () => {
	beforeEach(() => {
		mounts.length = 0;
	});

	it("REQ-001 AC-02 shows identical when the first export equals the loaded Markdown", async () => {
		await render(<EditorSpikeScreen candidates={only(UnchangedEditor)} />);

		expect(screen.getByTestId("round-trip")).toHaveTextContent(
			"Round trip: identical",
			{ exact: true },
		);
		expect(screen.getByTestId("export").props.children).toBe(CANONICAL_FIXTURE);
	});

	it("REQ-001 AC-02 shows the first differing byte", async () => {
		await render(<EditorSpikeScreen candidates={only(RestylingEditor)} />);

		expect(screen.getByTestId("round-trip")).toHaveTextContent(
			"Round trip: differs at 30",
			{ exact: true },
		);
	});

	it("later exports update the export but not the round-trip result", async () => {
		await render(<EditorSpikeScreen candidates={only(SilentEditor)} />);

		await act(() => mounts[0]?.onChange(CANONICAL_FIXTURE));
		await act(() => mounts[0]?.onChange("edited"));

		expect(screen.getByTestId("export").props.children).toBe("edited");
		expect(screen.getByTestId("round-trip")).toHaveTextContent(
			"Round trip: identical",
			{ exact: true },
		);
	});

	it("shows trigger events of the active mount", async () => {
		await render(<EditorSpikeScreen candidates={only(SilentEditor)} />);
		expect(screen.getByTestId("last-event")).toHaveTextContent(
			"Last event: none",
			{ exact: true },
		);

		await act(() => mounts[0]?.onTrigger({ kind: "link", query: "bud" }));

		expect(screen.getByTestId("events")).toHaveTextContent("Events: 1", {
			exact: true,
		});
		expect(screen.getByTestId("last-event")).toHaveTextContent(
			'Last event: link "bud"',
			{ exact: true },
		);
	});

	it("ignores callbacks from a previous mount", async () => {
		await render(<EditorSpikeScreen candidates={only(SilentEditor)} />);
		await fireEvent.press(
			screen.getByRole("button", { name: "Load non-canonical" }),
		);

		await act(() => {
			mounts[0]?.onChange("stale");
			mounts[0]?.onTrigger({ kind: "slash", query: "" });
		});

		expect(mounts).toHaveLength(2);
		expect(screen.getByTestId("round-trip")).toHaveTextContent(
			"Round trip: waiting",
			{ exact: true },
		);
		expect(screen.getByTestId("export").props.children).toBe("");
		expect(screen.getByTestId("events")).toHaveTextContent("Events: 0", {
			exact: true,
		});

		await act(() => mounts[1]?.onChange(NONCANONICAL_SAMPLE));

		expect(screen.getByTestId("round-trip")).toHaveTextContent(
			"Round trip: identical",
			{ exact: true },
		);
	});

	it("reloads from the latest export and clears the results", async () => {
		await render(<EditorSpikeScreen candidates={only(SilentEditor)} />);
		await act(() => {
			mounts[0]?.onChange("first");
			mounts[0]?.onChange("latest");
			mounts[0]?.onTrigger({ kind: "slash", query: "" });
		});

		await fireEvent.press(
			screen.getByRole("button", { name: "Reload from export" }),
		);

		expect(mounts[1]?.markdown).toBe("latest");
		expect(screen.getByTestId("round-trip")).toHaveTextContent(
			"Round trip: waiting",
			{ exact: true },
		);
		expect(screen.getByTestId("events")).toHaveTextContent("Events: 0", {
			exact: true,
		});

		await fireEvent.press(
			screen.getByRole("button", { name: "Load canonical" }),
		);

		expect(mounts[2]?.markdown).toBe(CANONICAL_FIXTURE);
	});

	it("switching candidates remounts the editor with the loaded sample", async () => {
		await render(
			<EditorSpikeScreen
				candidates={[
					{ id: "one", label: "One", Editor: FirstNamedEditor },
					{ id: "two", label: "Two", Editor: SecondNamedEditor },
				]}
			/>,
		);
		await fireEvent.press(
			screen.getByRole("button", { name: "Load non-canonical" }),
		);
		expect(screen.getByTestId("editor").props.children).toBe(
			`one:${NONCANONICAL_SAMPLE}`,
		);

		await fireEvent.press(screen.getByRole("button", { name: "Use Two" }));

		expect(screen.getByTestId("editor").props.children).toBe(
			`two:${NONCANONICAL_SAMPLE}`,
		);
	});

	it("shows a message when there are no candidates", async () => {
		await render(<EditorSpikeScreen candidates={[]} />);

		expect(screen.getByText("No editor candidates")).toBeOnTheScreen();
	});
});
