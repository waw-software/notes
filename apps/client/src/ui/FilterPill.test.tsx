import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { FilterPill } from "./FilterPill";

const flatStyle = (element: { props: Record<string, unknown> }) =>
	StyleSheet.flatten(element.props.style as object);

describe("FilterPill", () => {
	it("a selected pill is announced selected", async () => {
		await render(
			<FilterPill label="Everywhere" selected onPress={jest.fn()} />,
		);

		const pill = screen.getByRole("button", { name: "Everywhere" });
		expect(pill.props.accessibilityState.selected).toBe(true);
	});

	it("an unselected pill is announced not selected", async () => {
		await render(
			<FilterPill label="Home" selected={false} onPress={jest.fn()} />,
		);

		const pill = screen.getByRole("button", { name: "Home" });
		expect(pill.props.accessibilityState.selected).toBe(false);
	});

	it("pressing calls onPress", async () => {
		const onPress = jest.fn();
		await render(
			<FilterPill label="Home" selected={false} onPress={onPress} />,
		);

		await fireEvent.press(screen.getByRole("button", { name: "Home" }));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("the name is the label without the emoji", async () => {
		await render(
			<FilterPill
				label="Home"
				emoji="🏠"
				selected={false}
				onPress={jest.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: "Home" })).toBeOnTheScreen();
		const emoji = screen.getByText("🏠", { includeHiddenElements: true });
		expect(emoji.props.accessibilityElementsHidden).toBe(true);
		expect(emoji.props.importantForAccessibility).toBe("no-hide-descendants");
	});

	it("selected pill: ink fill and bg label; unselected: bg fill, 1 px border-strong, ink label", async () => {
		await render(
			<>
				<FilterPill label="Everywhere" selected onPress={jest.fn()} />
				<FilterPill label="Home" selected={false} onPress={jest.fn()} />
			</>,
		);

		const selected = screen.getByRole("button", { name: "Everywhere" });
		expect(flatStyle(selected)).toMatchObject({
			backgroundColor: "#171717",
			borderWidth: 1,
			borderColor: "#171717",
		});
		expect(flatStyle(screen.getByText("Everywhere"))).toMatchObject({
			color: "#FFFFFF",
			fontFamily: "Inter_500Medium",
			fontSize: 14,
		});
		const unselected = screen.getByRole("button", { name: "Home" });
		expect(flatStyle(unselected)).toMatchObject({
			backgroundColor: "#FFFFFF",
			borderWidth: 1,
			borderColor: "#D9D6D0",
		});
		expect(flatStyle(screen.getByText("Home"))).toMatchObject({
			color: "#171717",
		});
	});

	it("the pill keeps a 44 px target with radius 999", async () => {
		await render(
			<FilterPill label="Home" selected={false} onPress={jest.fn()} />,
		);

		expect(
			flatStyle(screen.getByRole("button", { name: "Home" })),
		).toMatchObject({
			minHeight: 44,
			minWidth: 44,
			borderRadius: 999,
			paddingHorizontal: 14,
		});
	});
});
