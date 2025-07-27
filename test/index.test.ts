import { describe, expect, it } from "vitest";
import { Auth } from "../src/index";

describe("Auth class", () => {
	it("should validate passwords correctly", () => {
		const auth = new Auth({
			passwordValidationRules: {
				minLength: 8,
				maxLength: 20,
				requireUppercase: false,
				requireLowercase: false,
				requireNumbers: false,
				requireSpecialCharacters: false,
			},
		});
		expect(auth.validatePassword("password123")).toBe(true);
		expect(auth.validatePassword("short")).toBe(false);
	});

	describe("Password validation with rules", () => {
		describe("minLength", () => {
			it("should return false for passwords shorter than minLength", () => {
				const auth = new Auth({
					passwordValidationRules: {
						minLength: 8,
					},
				});
				expect(auth.validatePassword("short")).toBe(false);
			});

			it("should return true for passwords equal to or greater than minLength", () => {
				const auth = new Auth({
					passwordValidationRules: {
						minLength: 8,
					},
				});
				expect(auth.validatePassword("longpass")).toBe(true);
			});
		});

		describe("maxLength", () => {
			it("should return false for passwords longer than maxLength", () => {
				const auth = new Auth({
					passwordValidationRules: {
						maxLength: 10,
					},
				});
				expect(auth.validatePassword("thisisaverylongpassword")).toBe(false);
			});

			it("should return true for passwords equal to or shorter than maxLength", () => {
				const auth = new Auth({
					passwordValidationRules: {
						maxLength: 10,
					},
				});
				expect(auth.validatePassword("short")).toBe(true);
			});
		});

		describe("requireUppercase", () => {
			it("should return false for passwords without uppercase letters when required", () => {
				const auth = new Auth({
					passwordValidationRules: {
						requireUppercase: true,
					},
				});
				expect(auth.validatePassword("lowercase")).toBe(false);
			});

			it("should return true for passwords with uppercase letters when required", () => {
				const auth = new Auth({
					passwordValidationRules: {
						requireUppercase: true,
					},
				});
				expect(auth.validatePassword("Uppercase")).toBe(true);
			});
		});

		describe("requireLowercase", () => {
			it("should return false for passwords without lowercase letters when required", () => {
				const auth = new Auth({
					passwordValidationRules: {
						requireLowercase: true,
					},
				});
				expect(auth.validatePassword("UPPERCASE")).toBe(false);
			});

			it("should return true for passwords with lowercase letters when required", () => {
				const auth = new Auth({
					passwordValidationRules: {
						requireLowercase: true,
					},
				});
				expect(auth.validatePassword("lowercase")).toBe(true);
			});
		});

		describe("requireNumbers", () => {
			it("should return false for passwords without numbers when required", () => {
				const auth = new Auth({
					passwordValidationRules: {
						requireNumbers: true,
					},
				});
				expect(auth.validatePassword("NoNumbers")).toBe(false);
			});

			it("should return true for passwords with numbers when required", () => {
				const auth = new Auth({
					passwordValidationRules: {
						requireNumbers: true,
					},
				});
				expect(auth.validatePassword("Password123")).toBe(true);
			});
		});

		describe("requireSpecialCharacters", () => {
			it("should return false for passwords without special characters when required", () => {
				const auth = new Auth({
					passwordValidationRules: {
						requireSpecialCharacters: true,
					},
				});
				expect(auth.validatePassword("NoSpecialChars")).toBe(false);
			});

			it("should return true for passwords with special characters when required", () => {
				const auth = new Auth({
					passwordValidationRules: {
						requireSpecialCharacters: true,
					},
				});
				expect(auth.validatePassword("Password!@#")).toBe(true);
			});
		});

		it("should throw an error if passed both a minLength and maxLength that are not compatible", () => {
			expect(() => {
				new Auth({
					passwordValidationRules: {
						minLength: 10,
						maxLength: 5,
					},
				});
			}).toThrowError(
				"Password validation rules are incompatible: minLength is greater than maxLength.",
			);
		});
	});
});
