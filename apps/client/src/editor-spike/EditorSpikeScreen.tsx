import { useMemo, useState } from "react";
import {
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import type { Candidate } from "./candidates";
import { firstDifference } from "./compare";
import type { EditorAdapterProps, EditorTrigger } from "./contract";
import { CANONICAL_FIXTURE, NONCANONICAL_SAMPLE } from "./fixture";

/** One mount of one editor and what it has reported so far. */
type Session = Readonly<{
	mount: number;
	candidateId: string | undefined;
	loaded: string;
	/** `firstDifference` of the first export; null until it arrives. */
	roundTrip: number | null;
	exported: string | null;
	events: number;
	lastEvent: EditorTrigger | null;
}>;

function newSession(
	mount: number,
	candidateId: string | undefined,
	loaded: string,
): Session {
	return {
		mount,
		candidateId,
		loaded,
		roundTrip: null,
		exported: null,
		events: 0,
		lastEvent: null,
	};
}

function roundTripText(roundTrip: number | null): string {
	if (roundTrip === null) {
		return "Round trip: waiting";
	}
	return roundTrip === -1
		? "Round trip: identical"
		: `Round trip: differs at ${roundTrip}`;
}

export default function EditorSpikeScreen(props: {
	candidates: readonly Candidate[];
}): React.JSX.Element {
	const [session, setSession] = useState(() =>
		newSession(0, props.candidates[0]?.id, CANONICAL_FIXTURE),
	);
	const { mount, loaded, exported, lastEvent } = session;
	const active = props.candidates.find(
		(candidate) => candidate.id === session.candidateId,
	);

	// Bound to one mount: calls from an older one are dropped.
	const callbacks = useMemo<Pick<EditorAdapterProps, "onChange" | "onTrigger">>(
		() => ({
			onChange: (markdown) =>
				setSession((current) =>
					current.mount !== mount
						? current
						: {
								...current,
								roundTrip:
									current.roundTrip ??
									firstDifference(current.loaded, markdown),
								exported: markdown,
							},
				),
			onTrigger: (trigger) =>
				setSession((current) =>
					current.mount !== mount
						? current
						: { ...current, events: current.events + 1, lastEvent: trigger },
				),
		}),
		[mount],
	);

	const remount = (candidateId: string | undefined, markdown: string) =>
		setSession((current) =>
			newSession(current.mount + 1, candidateId, markdown),
		);
	const load = (markdown: string) => remount(session.candidateId, markdown);

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
			<Text accessibilityRole="header" style={styles.title}>
				Editor spike
			</Text>
			{active === undefined ? (
				<Text style={styles.text}>No editor candidates</Text>
			) : (
				<>
					<View style={styles.row}>
						{props.candidates.map((candidate) => (
							<SpikeButton
								key={candidate.id}
								label={`Use ${candidate.label}`}
								selected={candidate.id === active.id}
								onPress={() => remount(candidate.id, loaded)}
							/>
						))}
					</View>
					<View style={styles.row}>
						<SpikeButton
							label="Load canonical"
							onPress={() => load(CANONICAL_FIXTURE)}
						/>
						<SpikeButton
							label="Load non-canonical"
							onPress={() => load(NONCANONICAL_SAMPLE)}
						/>
						<SpikeButton
							label="Reload from export"
							disabled={exported === null}
							onPress={() => {
								if (exported !== null) {
									load(exported);
								}
							}}
						/>
					</View>
					<View style={styles.editor}>
						<active.Editor
							key={mount}
							markdown={loaded}
							onChange={callbacks.onChange}
							onTrigger={callbacks.onTrigger}
						/>
					</View>
					<Text testID="round-trip" style={styles.text}>
						{roundTripText(session.roundTrip)}
					</Text>
					<Text testID="events" style={styles.text}>
						{`Events: ${session.events}`}
					</Text>
					<Text testID="last-event" style={styles.text}>
						{lastEvent === null
							? "Last event: none"
							: `Last event: ${lastEvent.kind} "${lastEvent.query}"`}
					</Text>
					<Text testID="export" selectable style={styles.export}>
						{exported ?? ""}
					</Text>
				</>
			)}
		</ScrollView>
	);
}

function SpikeButton(props: {
	label: string;
	onPress: () => void;
	selected?: boolean;
	disabled?: boolean;
}): React.JSX.Element {
	const selected = props.selected ?? false;
	const disabled = props.disabled ?? false;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={props.label}
			accessibilityState={{ selected, disabled }}
			disabled={disabled}
			onPress={props.onPress}
			style={[styles.button, selected && styles.buttonSelected]}
		>
			<Text
				style={[
					styles.text,
					selected && styles.textSelected,
					disabled && styles.textDisabled,
				]}
			>
				{props.label}
			</Text>
		</Pressable>
	);
}

// Colours are the tokens of docs/DESIGN.md §2, as literals: there is no theme module yet.
const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: "#FFFFFF" },
	content: { padding: 16, paddingTop: 56, gap: 12 },
	title: { color: "#171717", fontSize: 30 },
	row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	button: {
		minHeight: 44,
		justifyContent: "center",
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: "#D9D6D0",
		borderRadius: 12,
	},
	buttonSelected: { backgroundColor: "#171717", borderColor: "#171717" },
	text: { color: "#171717", fontSize: 16 },
	textSelected: { color: "#FFFFFF" },
	textDisabled: { color: "#5C5C5C" },
	editor: { height: 480, borderWidth: 1, borderColor: "#E4E2DD" },
	export: {
		color: "#171717",
		backgroundColor: "#F6F5F2",
		padding: 12,
		fontSize: 13,
		fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
	},
});
