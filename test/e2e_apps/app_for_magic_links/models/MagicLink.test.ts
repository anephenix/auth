import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	isHashed,
	isIsoString,
	isRandomString,
} from "../../../utils/comparators";
import auth from "../auth";
import { MagicLink } from "./MagicLink";
import { User } from "./User";

describe("MagicLinks model", () => {
	describe("validations", () => {
		const makeInvalidMagicLink = async () => {
			const magicLink = new MagicLink();
			return magicLink.$validate();
		};

		it("should have a user_id", async () => {
			await expect(makeInvalidMagicLink).rejects.toThrowError(
				/user_id: must have required property 'user_id'/,
			);
		});
		it("should have a token", async () => {
			await expect(makeInvalidMagicLink).rejects.toThrowError(
				/token: must have required property 'token'/,
			);
		});

		it("should have a hashed_code", async () => {
			await expect(makeInvalidMagicLink).rejects.toThrowError(
				/hashed_code: must have required property 'hashed_code'/,
			);
		});

		it("should have an expires_at datetime", async () => {
			await expect(makeInvalidMagicLink).rejects.toThrowError(
				/expires_at: must have required property 'expires_at'/,
			);
		});
	});

	describe("hooks", () => {
		beforeEach(async () => {
			await User.query().delete();
			await MagicLink.query().delete();
		});

		describe("beforeInsert", () => {
			it("should prefill the created_at and updated_at datetime fields", async () => {
				const user = await User.query().insert({
					username: "testuser",
					email: "testuser@example.com",
				});

				const { token, tokenExpiresAt, hashedCode } =
					await MagicLink.generateTokens();

				const magicLink = await MagicLink.query().insert({
					user_id: user.id,
					token,
					hashed_code: hashedCode,
					expires_at: tokenExpiresAt.toISOString(),
				});

				expect(isIsoString(magicLink.created_at)).toBe(true);
				expect(isIsoString(magicLink.updated_at)).toBe(true);
			});
		});

		describe("beforeUpdate", () => {
			it("should update the updated_at datetime field", async () => {
				const user = await User.query().insert({
					username: "testuser",
					email: "testuser@example.com",
				});

				const { token, tokenExpiresAt, hashedCode } =
					await MagicLink.generateTokens();

				const magicLink = await MagicLink.query().insert({
					user_id: user.id,
					token,
					hashed_code: hashedCode,
					expires_at: tokenExpiresAt.toISOString(),
				});

				expect(isIsoString(magicLink.created_at)).toBe(true);

				await magicLink.$query().patch({
					used_at: new Date().toISOString(),
				});

				expect(magicLink.updated_at > magicLink.created_at).toBe(true);
			});
		});
	});

	describe("static methods", () => {
		describe("generateTokens", () => {
			it("should generate the token, token expire date, code and hashed code for a magic link token", async () => {
				const { token, tokenExpiresAt, code, hashedCode } =
					await MagicLink.generateTokens();
				const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
				expect(isRandomString(token)).toBe(true);
				expect(tokenExpiresAt).toBeInstanceOf(Date);
				expect(isRandomString(code)).toBe(true);
				expect(isHashed(hashedCode)).toBe(true);

				const isHashedCodeVerified = await auth.verifyPassword(
					code,
					hashedCode,
				);
				expect(isHashedCodeVerified).toBe(true);
				expect(tokenExpiresAt).toStrictEqual(fiveMinutesFromNow);
			});
		});

		describe("verifyTokenAndCode", () => {
			beforeEach(async () => {
				await User.query().delete();
				await MagicLink.query().delete();
			});

			describe("when the token and code is valid", () => {
				it("should return the user_id of the token, as confirmation that the token is valid", async () => {
					const user = await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
					});

					const { token, tokenExpiresAt, hashedCode, code } =
						await MagicLink.generateTokens();

					const magicLink = await MagicLink.query().insert({
						user_id: user.id,
						token,
						hashed_code: hashedCode,
						expires_at: tokenExpiresAt.toISOString(),
					});

					const result = await MagicLink.verifyTokenAndCode(
						magicLink.token,
						code,
					);

					expect(result).toEqual({ userId: user.id });
				});
			});

			describe("when the token and code is valid, but the magic link is already used", () => {
				it("should throw an error", async () => {
					const user = await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
					});

					const { token, tokenExpiresAt, hashedCode, code } =
						await MagicLink.generateTokens();

					const magicLink = await MagicLink.query().insert({
						user_id: user.id,
						token,
						hashed_code: hashedCode,
						expires_at: tokenExpiresAt.toISOString(),
					});

					// Verify the token and code
					await MagicLink.verifyTokenAndCode(magicLink.token, code);

					// Then try again
					const tryAgain = async () => {
						await MagicLink.verifyTokenAndCode(magicLink.token, code);
					};

					await expect(tryAgain).rejects.toThrowError(
						"Magic link has already been used",
					);
				});
			});

			describe("when the token and code is valid, but the magic link has expired", () => {
				it("should throw an error", async () => {
					const user = await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
					});

					const { token, tokenExpiresAt, hashedCode, code } =
						await MagicLink.generateTokens();

					const magicLink = await MagicLink.query().insert({
						user_id: user.id,
						token,
						hashed_code: hashedCode,
						expires_at: tokenExpiresAt.toISOString(),
					});

					vi.useFakeTimers();
					vi.advanceTimersByTime(1000 * 60 * 10); // Simulate 10 minutes passing

					const tryExpiredToken = async () => {
						await MagicLink.verifyTokenAndCode(magicLink.token, code);
					};

					await expect(tryExpiredToken).rejects.toThrowError(
						"Magic link has expired",
					);

					vi.useRealTimers();
				});
			});

			describe("when the token is valid but the code is not", () => {
				it("should throw an error", async () => {
					const user = await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
					});

					const { token, tokenExpiresAt, hashedCode } =
						await MagicLink.generateTokens();

					const magicLink = await MagicLink.query().insert({
						user_id: user.id,
						token,
						hashed_code: hashedCode,
						expires_at: tokenExpiresAt.toISOString(),
					});

					const tryIncorrectCode = async () => {
						await MagicLink.verifyTokenAndCode(
							magicLink.token,
							"incorrectCode",
						);
					};

					await expect(tryIncorrectCode).rejects.toThrowError(
						"Invalid magic link code",
					);
				});
			});

			describe("when the token is not found", () => {
				it("should throw an error", async () => {
					const tryInvalidToken = async () => {
						await MagicLink.verifyTokenAndCode("invalidToken", "code");
					};

					await expect(tryInvalidToken).rejects.toThrowError(
						"Magic link not found",
					);
				});
			});
		});
	});
});
