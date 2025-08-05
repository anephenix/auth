import { describe, expect, it } from "vitest";
import isEmail from "./isEmail";

describe("isEmail", () => {
	it("should return true for valid email addresses", () => {
		expect(isEmail("test@example.com")).toBe(true);
	});

	it("should return false for invalid email addresses", () => {
		const invalidEmails = [
			"plainaddress",
			"@missingusername.com",
			"username@com",
		];

		expect(invalidEmails.every((email) => !isEmail(email))).toBe(true);
	});
});
