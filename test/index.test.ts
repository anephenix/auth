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

	describe("hashPassword", () => {
		it("should hash a password", async () => {
			const auth = new Auth({});
			const hashedPassword = await auth.hashPassword("plaintextPassword");
			expect(hashedPassword).toBeDefined();
			expect(hashedPassword.includes("plaintextPassword")).toBe(false);
			expect(hashedPassword).toMatch(
				/^\$argon2id\$v=(?:16|19)\$m=\d{1,10},t=\d{1,10},p=\d{1,3}(?:,keyid=[A-Za-z0-9+/]{0,11}(?:,data=[A-Za-z0-9+/]{0,43})?)?\$[A-Za-z0-9+/]{11,64}\$[A-Za-z0-9+/]{16,86}$/i,
			);
		});
	});

	describe("verifyPassword", () => {
		it("should verify a password against a hashed password", async () => {
			const auth = new Auth({});
			const plaintextPassword = "plaintextPassword";
			const hashedPassword = await auth.hashPassword(plaintextPassword);
			const isValid = await auth.verifyPassword(
				plaintextPassword,
				hashedPassword,
			);
			expect(isValid).toBe(true);
		});

		it("should return false for an incorrect password", async () => {
			const auth = new Auth({});
			const hashedPassword = await auth.hashPassword("correctPassword");
			const isValid = await auth.verifyPassword(
				"wrongPassword",
				hashedPassword,
			);
			expect(isValid).toBe(false);
		});
	});

	describe("#generateSession", () => {
		it("should generate a session with an access token, refresh token, and expiration times for both tokens", async () => {
			const auth = new Auth({});
			const session = await auth.generateSession();
			const oneHourFromNow = new Date(Date.now() + 3600 * 1000);
			const oneDayFromNow = new Date(Date.now() + 86400 * 1000);
			expect(session).toBeDefined();
			expect(session.accessToken).toBeDefined();
			expect(session.refreshToken).toBeDefined();
			expect(session.accessTokenExpiresAt).toStrictEqual(oneHourFromNow);
			expect(session.refreshTokenExpiresAt).toStrictEqual(oneDayFromNow);
		});

		it("should generate a session with custom expiration times if provided in the auth config", async () => {
			const auth = new Auth({
				sessionOptions: {
					accessTokenExpiresIn: 7200, // 2 hours
					refreshTokenExpiresIn: 86400 * 2, // 2 days
				},
			});
			const session = await auth.generateSession();
			const twoHoursFromNow = new Date(Date.now() + 3600 * 2 * 1000);
			const twoDaysFromNow = new Date(Date.now() + 3600 * 48 * 1000);
			expect(session.accessTokenExpiresAt).toStrictEqual(twoHoursFromNow);
			expect(session.refreshTokenExpiresAt).toStrictEqual(twoDaysFromNow);
		});
	});
});
