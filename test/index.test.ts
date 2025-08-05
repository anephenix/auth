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
		it("should generate a session with an access token, refresh token, and default expiration times for both tokens", () => {
			const auth = new Auth({});
			const session = auth.generateSession();
			const oneHourFromNow = new Date(Date.now() + 3600 * 1000);
			const oneDayFromNow = new Date(Date.now() + 86400 * 1000);
			expect(session).toBeDefined();
			expect(session.accessToken).toBeDefined();
			expect(session.refreshToken).toBeDefined();
			expect(session.accessTokenExpiresAt).toStrictEqual(oneHourFromNow);
			expect(session.refreshTokenExpiresAt).toStrictEqual(oneDayFromNow);
		});

		it("should generate a session with custom expiration times if provided in the auth config", () => {
			const auth = new Auth({
				sessionOptions: {
					accessTokenExpiresIn: 7200, // 2 hours
					refreshTokenExpiresIn: 86400 * 2, // 2 days
				},
			});
			const session = auth.generateSession();
			const twoHoursFromNow = new Date(Date.now() + 3600 * 2 * 1000);
			const twoDaysFromNow = new Date(Date.now() + 3600 * 48 * 1000);
			expect(session.accessTokenExpiresAt).toStrictEqual(twoHoursFromNow);
			expect(session.refreshTokenExpiresAt).toStrictEqual(twoDaysFromNow);
		});

		/*
			NOTE - I can foresee that someone might want to generate a session 
			with custom expiration times that differ to the defaults, as well as
			options set in the auth config. 
			
			Say for example, a user wants their access token to expire after 
			5 minutes, and the refresh token to expire after 8 hours. With this, 
			we could provide them with that option, while still allowing everyone
			else to use the defaults or the auth config options.
			
			This test is a placeholder for that functionality.
		*/
		it("should generate a session with custom expiration times if provided in the function", () => {
			const auth = new Auth({
				sessionOptions: {
					accessTokenExpiresIn: 7200, // 2 hours
					refreshTokenExpiresIn: 86400 * 2, // 2 days
				},
			});
			const uniqueSession = auth.generateSession({
				accessTokenExpiresIn: 3600 * 0.25, // 15 minutes
				refreshTokenExpiresIn: 3600 * 8, // 8 hours
			});
			const fifteenMinutesFromNow = new Date(Date.now() + 3600 * 0.25 * 1000);
			const eightHoursFromNow = new Date(Date.now() + 3600 * 8 * 1000);
			expect(uniqueSession.accessTokenExpiresAt).toStrictEqual(
				fifteenMinutesFromNow,
			);
			expect(uniqueSession.refreshTokenExpiresAt).toStrictEqual(
				eightHoursFromNow,
			);
		});

		it("should generate a session with custom token generators if provided in the auth config", () => {
			const auth = new Auth({
				sessionOptions: {
					/*
						NOTE - These static strings are just for testing 
						purposes. In real-world usage, we would be 
						passing in a function that generates 
						cryptographically secure random strings
					*/
					accessTokenGenerator: () => "customAccessToken",
					refreshTokenGenerator: () => "customRefreshToken",
				},
			});
			const session = auth.generateSession();
			expect(session.accessToken).toBe("customAccessToken");
			expect(session.refreshToken).toBe("customRefreshToken");
		});
	});

	describe("#generateTokenAndCode", () => {
		describe("when using default options", () => {
			it("should generate a token, code, and token expiration time of 5 minutes", async () => {
				const auth = new Auth({});
				const { token, tokenExpiresAt, code, hashedCode } =
					await auth.generateTokenAndCode();
				const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
				expect(token).toBeDefined(); // This is not checking the token's format, just that it exists - need to improve on this, as for other checks in this file
				expect(tokenExpiresAt).toBeInstanceOf(Date);
				expect(code).toBeDefined();
				expect(hashedCode).toBeDefined();
				expect(tokenExpiresAt).toStrictEqual(fiveMinutesFromNow);
			});
		});

		describe("when using custom options passed during initialization of auth", () => {
			it("should generate a token, code, and token expiration time as defined in the auth config", async () => {
				const auth = new Auth({
					tokenOptions: {
						tokenExpiresIn: 60 * 10, // 10 minutes
						/*
							NOTE - These static strings are just for testing 
							purposes. In real-world usage, we would be 
							passing in a function that generates 
							cryptographically secure random strings
						*/
						tokenGenerator: () => "customToken",
						codeGenerator: () => "customCode",
					},
				});
				const { token, tokenExpiresAt, code, hashedCode } =
					await auth.generateTokenAndCode();
				const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
				expect(token).toBe("customToken");
				expect(tokenExpiresAt).toBeInstanceOf(Date);
				expect(code).toBe("customCode");
				expect(hashedCode).toBeDefined();
				expect(tokenExpiresAt).toStrictEqual(tenMinutesFromNow);
			});
		});

		describe("when using custom options passed to the function", () => {
			it("should generate a token, code, and token expiration time as defined in the function", async () => {
				const auth = new Auth({
					tokenOptions: {
						tokenExpiresIn: 60 * 10, // 10 minutes
					},
				});
				const { token, tokenExpiresAt, code, hashedCode } =
					await auth.generateTokenAndCode({ tokenExpiresIn: 60 * 15 });
				const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
				expect(token).toBeDefined(); // This is not checking the token's format, just that it exists - need to improve on this, as for other checks in this file
				expect(tokenExpiresAt).toBeInstanceOf(Date);
				expect(code).toBeDefined();
				expect(hashedCode).toBeDefined();
				expect(tokenExpiresAt).toStrictEqual(fifteenMinutesFromNow);
			});
		});
	});
});
