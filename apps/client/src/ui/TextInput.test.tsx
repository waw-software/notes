import { fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";
import { fontFamilies } from "./fonts";
import { TextInput, type TextInputProps } from "./TextInput";

function ServerUrl(props: Partial<TextInputProps>) {
	return (
		<TextInput
			label="Server URL"
			value="https://notes.example.com"
			onValueChange={jest.fn()}
			{...props}
		/>
	);
}

function input(label = "Server URL") {
	return screen.getByLabelText(label);
}

function inputStyle(label = "Server URL") {
	return StyleSheet.flatten(input(label).props.style);
}

describe("TextInput", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("the label above is the field's accessible name", async () => {
		await render(<ServerUrl />);

		expect(screen.getByText("Server URL")).toBeOnTheScreen();
		expect(input().props).toMatchObject({
			value: "https://notes.example.com",
			accessibilityLabel: "Server URL",
			"aria-label": "Server URL",
		});
	});

	it("typing calls onValueChange with the text", async () => {
		const onValueChange = jest.fn();
		await render(<ServerUrl onValueChange={onValueChange} />);

		await fireEvent.changeText(input(), "https://other.example.com");

		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenLastCalledWith("https://other.example.com");
	});

	it("a url field has the URL keyboard, no autocorrect and the mono family", async () => {
		await render(<ServerUrl kind="url" />);

		expect(input().props).toMatchObject({
			keyboardType: "url",
			autoCapitalize: "none",
			autoCorrect: false,
		});
		expect(input().props.secureTextEntry).toBe(false);
		expect(fontFamilies.mono).toBe("Menlo");
		expect(inputStyle().fontFamily).toBe("Menlo");
	});

	it("a token field hides its text and uses the mono family", async () => {
		await render(<ServerUrl label="Access token" kind="token" />);

		expect(input("Access token").props).toMatchObject({
			secureTextEntry: true,
			autoCapitalize: "none",
			autoCorrect: false,
		});
		expect(inputStyle("Access token").fontFamily).toBe("Menlo");
	});

	it("a text field uses Inter 400", async () => {
		await render(<ServerUrl />);

		expect(input().props.secureTextEntry).toBe(false);
		expect(input().props.keyboardType).toBe("default");
		expect(inputStyle().fontFamily).toBe("Inter_400Regular");
	});

	it("at rest the field is bg with a border-strong border; focused it turns accent-text; blurred it returns", async () => {
		await render(<ServerUrl />);

		expect(inputStyle()).toMatchObject({
			backgroundColor: "#FFFFFF",
			borderColor: "#D9D6D0",
			borderWidth: 1,
			borderRadius: 12,
			paddingHorizontal: 14,
			fontSize: 16,
			color: "#171717",
		});

		await fireEvent(input(), "focus");

		expect(inputStyle().borderColor).toBe("#B01A31");

		await fireEvent(input(), "blur");

		expect(inputStyle().borderColor).toBe("#D9D6D0");
	});

	it("an error replaces the helper text and is announced", async () => {
		const announce = jest
			.spyOn(AccessibilityInfo, "announceForAccessibility")
			.mockImplementation(() => {});
		const helperText = "Use the address of your server.";
		const errorText = "Enter a valid server URL.";
		const view = await render(<ServerUrl helperText={helperText} />);

		expect(screen.getByText(helperText)).toBeOnTheScreen();
		expect(input().props.accessibilityHint).toBe(helperText);
		expect(announce).not.toHaveBeenCalled();

		await view.rerender(
			<ServerUrl helperText={helperText} errorText={errorText} />,
		);

		expect(screen.getByText(errorText)).toBeOnTheScreen();
		expect(screen.queryByText(helperText)).toBeNull();
		expect(input().props.accessibilityHint).toBe(errorText);
		expect(inputStyle().borderColor).toBe("#B01A31");
		expect(announce).toHaveBeenCalledTimes(1);
		expect(announce).toHaveBeenLastCalledWith(errorText);

		await view.rerender(
			<ServerUrl helperText={helperText} errorText={errorText} />,
		);

		expect(announce).toHaveBeenCalledTimes(1);

		await view.rerender(<ServerUrl helperText={helperText} />);
		await view.rerender(
			<ServerUrl helperText={helperText} errorText={errorText} />,
		);

		expect(announce).toHaveBeenCalledTimes(2);
	});

	it("a disabled field is not editable", async () => {
		await render(<ServerUrl disabled />);

		expect(input().props.editable).toBe(false);
		expect(input().props.accessibilityState).toMatchObject({ disabled: true });
		expect(inputStyle()).toMatchObject({
			borderColor: "#D9D6D0",
			color: "#5C5C5C",
		});
	});

	it("mobile and desktop fields are both 52 high, mobile by default", async () => {
		const view = await render(<ServerUrl />);

		expect(inputStyle().minHeight).toBe(52);

		await view.rerender(<ServerUrl layout="mobile" />);

		expect(inputStyle().minHeight).toBe(52);

		await view.rerender(<ServerUrl layout="desktop" />);

		expect(inputStyle().minHeight).toBe(52);
	});
});
