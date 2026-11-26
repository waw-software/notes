import { afterEach, describe, expect, it } from "vitest";
import {
	captureIos,
	deepLink,
	hasSettled,
	pickDevice,
	portBusyMessage,
} from "./ios.ts";

const OLDER = "com.apple.CoreSimulator.SimRuntime.iOS-9-3";
const NEWER = "com.apple.CoreSimulator.SimRuntime.iOS-27-2";

const list = {
	devices: {
		[OLDER]: [
			{
				name: "iPhone 17e",
				udid: "OLD-17E",
				state: "Shutdown",
				isAvailable: true,
			},
		],
		[NEWER]: [
			{
				name: "iPhone 17",
				udid: "NEW-17",
				state: "Booted",
				isAvailable: true,
			},
			{
				name: "iPhone 17e",
				udid: "NEW-17E",
				state: "Shutdown",
				isAvailable: true,
			},
		],
	},
};

describe("deepLink", () => {
	it("deepLink builds the Expo Go URL for the root", () => {
		expect(deepLink(8082, "/")).toBe("exp://127.0.0.1:8082/--/");
	});

	it("deepLink builds it for a nested path", () => {
		expect(deepLink(8082, "/notes/a")).toBe("exp://127.0.0.1:8082/--/notes/a");
	});
});

describe("pickDevice", () => {
	it("pickDevice picks the available device by name across runtimes", () => {
		expect(pickDevice(list, "iPhone 17e")?.udid).toBe("NEW-17E");
	});

	it("pickDevice reports booted state", () => {
		expect(pickDevice(list, "iPhone 17")).toEqual({
			udid: "NEW-17",
			booted: true,
		});
		expect(pickDevice(list, "iPhone 17e")?.booted).toBe(false);
	});

	it("pickDevice skips an unavailable device", () => {
		const json = {
			devices: {
				[NEWER]: [
					{
						name: "iPhone 17e",
						udid: "GONE",
						state: "Shutdown",
						isAvailable: false,
					},
				],
				[OLDER]: [
					{
						name: "iPhone 17e",
						udid: "OLD-17E",
						state: "Shutdown",
						isAvailable: true,
					},
				],
			},
		};
		expect(pickDevice(json, "iPhone 17e")?.udid).toBe("OLD-17E");
	});

	it("pickDevice returns null for a missing name", () => {
		expect(pickDevice(list, "iPhone 3G")).toBeNull();
	});

	it("pickDevice returns null for malformed input", () => {
		for (const json of [
			null,
			"text",
			{},
			{ devices: null },
			{ devices: { [NEWER]: "none" } },
			{ devices: { [NEWER]: [null, { name: "iPhone 17e" }] } },
		]) {
			expect(pickDevice(json, "iPhone 17e")).toBeNull();
		}
	});
});

describe("hasSettled", () => {
	const before = Buffer.from("before");

	it("hasSettled is false with fewer than two shots", () => {
		expect(hasSettled(before, [])).toBe(false);
		expect(hasSettled(before, [Buffer.from("app")])).toBe(false);
	});

	it("hasSettled is false when the last two differ", () => {
		expect(
			hasSettled(before, [Buffer.from("loading"), Buffer.from("app")]),
		).toBe(false);
	});

	it("hasSettled is false when the last equals the before shot", () => {
		expect(
			hasSettled(before, [Buffer.from("before"), Buffer.from("before")]),
		).toBe(false);
	});

	it("hasSettled is true when the last two are equal and differ from before", () => {
		expect(
			hasSettled(before, [
				Buffer.from("loading"),
				Buffer.from("app"),
				Buffer.from("app"),
			]),
		).toBe(true);
	});
});

describe("portBusyMessage", () => {
	it("portBusyMessage names the port when something answers", () => {
		expect(portBusyMessage(8082, true)).toBe(
			"port 8082 is already in use; stop the other Metro first",
		);
	});

	it("portBusyMessage is null when nothing answers", () => {
		expect(portBusyMessage(8082, false)).toBeNull();
	});
});

describe("captureIos", () => {
	const platform = Object.getOwnPropertyDescriptor(process, "platform");

	afterEach(() => {
		if (platform) Object.defineProperty(process, "platform", platform);
	});

	it("captureIos refuses on a non-darwin platform", async () => {
		Object.defineProperty(process, "platform", {
			value: "linux",
			configurable: true,
		});
		await expect(captureIos([], "unused", "unused")).rejects.toThrow(
			"iOS capture needs macOS",
		);
	});
});
