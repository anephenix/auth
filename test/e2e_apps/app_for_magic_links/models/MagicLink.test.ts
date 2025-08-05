import { describe, it } from "vitest";

describe("MagicLinks model", () => {
	describe("validations", () => {
		it.todo("should have a user_id");
		it.todo("should have a token");
		it.todo("should have a hashed_code");
		it.todo("should have an expired_at datetime");
	});

	describe("hooks", () => {
		describe("beforeInsert", () => {
			it.todo("should prefill the created_at and updated_at datetime fields");
		});

		describe("beforeUpdate", () => {
			it.todo("should update updated_at datetime field");
		});
	});

	describe("static methods", () => {
		describe("generateTokens", () => {
			it.todo(
				"should generate the token, token expire date, code and hashed code for a magic link token",
			);
		});

		describe("verifyTokenAndCode", () => {
			describe("when the token and code is valid", () => {
				it.todo(
					"should return the user_id of the token, as confirmation that the token is valid",
				);
			});

			describe("when the token and code is valid, but the magic link is already used", () => {
				it.todo("should throw an error");
			});

			describe("when the token and code is valid, but the magic link has expired", () => {
				it.todo("should throw an error");
			});

			describe("when the token is valid but the code is not", () => {
				it.todo("should throw an error");
			});

			describe("when the token is not found", () => {
				it.todo("should throw an error");
			});
		});
	});
});
