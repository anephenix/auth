import { describe, expect, it } from "vitest";
import isEmail from "./isEmail";

describe("isEmail", () => {
	it("should return true for valid email addresses", () => {
		expect(isEmail("test@example.com")).toBe(true);
	});

	it("should return false for invalid email addresses", () => {
		expect(isEmail("invalid-email")).toBe(false);
	});
});
