import { theme } from "@waw/design-tokens";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "../ui/Button";
import { FilterPill } from "../ui/FilterPill";
import { TextInput, type TextInputProps } from "../ui/TextInput";

type Layout = "mobile" | "desktop";

const sampleUrl = "https://notes.example.com";
const sampleToken = "notes-token-1234";
const addressError = "Enter the server address.";

const pills: readonly { label: string; emoji?: string }[] = [
	{ label: "Everywhere" },
	{ label: "Home", emoji: "🏠" },
	{ label: "#renovation" },
];

// The buttons only show their states; the gallery has nothing to do on press.
function noop() {}

function Pills() {
	const [selected, setSelected] = useState("Everywhere");

	return (
		<View style={styles.row}>
			{pills.map((pill) => (
				<FilterPill
					key={pill.label}
					{...pill}
					selected={pill.label === selected}
					onPress={() => setSelected(pill.label)}
				/>
			))}
		</View>
	);
}

function Field({
	initialValue = "",
	...props
}: Omit<TextInputProps, "value" | "onValueChange"> & {
	layout: Layout;
	initialValue?: string;
}) {
	const [value, setValue] = useState(initialValue);

	return <TextInput {...props} value={value} onValueChange={setValue} />;
}

function DisabledConnect() {
	return (
		<Button
			variant="primary"
			size="compact"
			label="Connect"
			disabled
			onPress={noop}
		/>
	);
}

function MobileForms() {
	return (
		<View style={styles.mobile}>
			<Pills />
			<Field
				layout="mobile"
				label="Server URL"
				kind="url"
				initialValue={sampleUrl}
			/>
			<Field
				layout="mobile"
				label="Access token"
				kind="token"
				initialValue={sampleToken}
			/>
			<Button variant="primary" label="Connect" fullWidth onPress={noop} />
			<Button
				variant="secondary"
				label="Scan QR code"
				fullWidth
				onPress={noop}
			/>
			<View style={styles.row}>
				<Button
					variant="text"
					label="How to deploy with Docker"
					onPress={noop}
				/>
				<DisabledConnect />
			</View>
			<Field
				layout="mobile"
				label="Server URL"
				kind="url"
				errorText={addressError}
			/>
		</View>
	);
}

function DesktopForms() {
	return (
		<View style={styles.desktop}>
			<View style={[styles.column, styles.connectColumn]}>
				<Field
					layout="desktop"
					label="Server URL or pairing link"
					kind="url"
					initialValue={sampleUrl}
				/>
				<Field
					layout="desktop"
					label="Access token"
					kind="token"
					initialValue={sampleToken}
				/>
				<Button variant="primary" label="Connect" fullWidth onPress={noop} />
			</View>
			<View style={[styles.column, styles.statesColumn]}>
				<Pills />
				<Button
					variant="secondary"
					size="compact"
					label="Retry"
					onPress={noop}
				/>
				<Button
					variant="text"
					label="Read the full deployment guide"
					onPress={noop}
				/>
				<DisabledConnect />
				<Field
					layout="desktop"
					label="Server URL"
					kind="url"
					initialValue={sampleUrl}
					helperText="Paste the address from the server's setup page."
				/>
				<Field
					layout="desktop"
					label="Access token"
					kind="token"
					initialValue={sampleToken}
					disabled
				/>
				<Field
					layout="desktop"
					label="Server URL"
					kind="url"
					errorText={addressError}
				/>
			</View>
		</View>
	);
}

export default function GalleryForms({ layout }: { layout: Layout }) {
	return layout === "mobile" ? <MobileForms /> : <DesktopForms />;
}

const styles = StyleSheet.create({
	// Centred, so the first row stays clear of the phone's status bar.
	mobile: {
		flex: 1,
		justifyContent: "center",
		gap: theme.space.overlayGap,
		paddingHorizontal: theme.space.sheetPadding,
		backgroundColor: theme.color.bg,
	},
	row: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: theme.space.segmentGap,
	},
	desktop: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.space.mainInline,
		paddingHorizontal: theme.space.mainInline,
		backgroundColor: theme.color.bg,
	},
	column: {
		flex: 1,
		maxWidth: theme.size.phoneWidth,
	},
	connectColumn: {
		gap: theme.space.overlayGap,
	},
	statesColumn: {
		gap: theme.space.sheetPadding,
	},
});
