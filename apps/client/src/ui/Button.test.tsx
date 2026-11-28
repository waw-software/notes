import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { Button } from "./Button";

// Pressable's host view only has responder handlers, so a held press is a
// responder grant; its release stays pressed for React Native's minimum time.
const touch = {
	persist: () => {},
	currentTarget: { measure: () => {} },
	nativeEvent: { changedTouches: [], touches: [], pageX: 0, pageY: 0 },
};

async function hold(label: string) {
	await fireEvent(
		screen.getByRole("button", { name: label }),
		"responderGrant",
		touch,
	);
}

async function release(label: string) {
	await fireEvent(
		screen.getByRole("button", { name: label }),
		"responderRelease",
		touch,
	);
	await act(() => jest.runOnlyPendingTimers());
}

function targetStyle(label: string) {
	return StyleSheet.flatten(
		screen.getByRole("button", { name: label }).props.style,
	);
}

function labelStyle(label: string) {
	return StyleSheet.flatten(screen.getByText(label).props.style);
}

describe("Button", () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	it("primary button is a button named by its label and calls onPress", async () => {
		const onPress = jest.fn();
		await render(
			<Button variant="primary" label="Connect" onPress={onPress} />,
		);

		await fireEvent.press(screen.getByRole("button", { name: "Connect" }));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("secondary button calls onPress", async () => {
		const onPress = jest.fn();
		await render(
			<Button variant="secondary" label="Cancel" onPress={onPress} />,
		);

		await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("text button is a button named by its label and calls onPress", async () => {
		const onPress = jest.fn();
		await render(<Button variant="text" label="Retry" onPress={onPress} />);

		await fireEvent.press(screen.getByRole("button", { name: "Retry" }));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("disabled primary is announced disabled and does not call onPress", async () => {
		const onPress = jest.fn();
		await render(
			<Button variant="primary" label="Connect" disabled onPress={onPress} />,
		);
		const button = screen.getByRole("button", { name: "Connect" });

		await fireEvent.press(button);

		expect(button.props.accessibilityState).toMatchObject({ disabled: true });
		expect(onPress).not.toHaveBeenCalled();
		expect(targetStyle("Connect")).toMatchObject({
			backgroundColor: "#F6F5F2",
		});
		expect(labelStyle("Connect")).toMatchObject({ color: "#5C5C5C" });

		await hold("Connect");

		expect(targetStyle("Connect")).toMatchObject({
			backgroundColor: "#F6F5F2",
		});
	});

	it("held primary turns accent-dark", async () => {
		jest.useFakeTimers();
		await render(
			<Button variant="primary" label="Connect" onPress={jest.fn()} />,
		);

		await hold("Connect");
		expect(targetStyle("Connect")).toMatchObject({
			backgroundColor: "#8C1427",
		});

		await release("Connect");
		expect(targetStyle("Connect")).toMatchObject({
			backgroundColor: "#D4213D",
		});
	});

	it("held secondary turns divider", async () => {
		jest.useFakeTimers();
		await render(
			<Button variant="secondary" label="Cancel" onPress={jest.fn()} />,
		);

		await hold("Cancel");
		expect(targetStyle("Cancel")).toMatchObject({ backgroundColor: "#EEECE8" });

		await release("Cancel");
		expect(targetStyle("Cancel")).toMatchObject({ backgroundColor: "#FFFFFF" });
	});

	it("held text button label turns accent-dark", async () => {
		jest.useFakeTimers();
		await render(<Button variant="text" label="Retry" onPress={jest.fn()} />);

		await hold("Retry");
		expect(labelStyle("Retry")).toMatchObject({ color: "#8C1427" });

		await release("Retry");
		expect(labelStyle("Retry")).toMatchObject({ color: "#B01A31" });
	});

	it("regular primary is 54 high with radius 14", async () => {
		await render(<Button variant="primary" label="Go" onPress={jest.fn()} />);

		expect(targetStyle("Go")).toMatchObject({
			minHeight: 54,
			minWidth: 44,
			borderRadius: 14,
			backgroundColor: "#D4213D",
		});
		expect(labelStyle("Go")).toMatchObject({
			color: "#FFFFFF",
			fontFamily: "Inter_600SemiBold",
		});
	});

	it.each(["primary", "secondary"] as const)(
		"compact primary and compact secondary are 44 high with radius 12: %s",
		async (variant) => {
			await render(
				<Button
					variant={variant}
					size="compact"
					label="Go"
					onPress={jest.fn()}
				/>,
			);

			expect(targetStyle("Go")).toMatchObject({
				minHeight: 44,
				borderRadius: 12,
			});
		},
	);

	it("secondary has a 1 px border-strong outline on bg", async () => {
		await render(<Button variant="secondary" label="Go" onPress={jest.fn()} />);

		expect(targetStyle("Go")).toMatchObject({
			borderWidth: 1,
			borderColor: "#D9D6D0",
			backgroundColor: "#FFFFFF",
		});
	});

	it("fullWidth stretches", async () => {
		await render(
			<Button variant="primary" label="Go" fullWidth onPress={jest.fn()} />,
		);

		expect(targetStyle("Go")).toMatchObject({ alignSelf: "stretch" });
	});
});
