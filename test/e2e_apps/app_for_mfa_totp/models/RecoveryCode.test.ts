import { describe, expect, it } from "vitest";
import { RecoveryCode } from "./RecoveryCode";

describe("RecoveryCode Model", () => {
	describe("validations", () => {
		const makeInvalidRecoveryCode = async () => {
			const recoveryCode = new RecoveryCode();
			return recoveryCode.$validate();
		};

		it("should have a user_id", async () => {
			await expect(makeInvalidRecoveryCode).rejects.toThrowError(
				/user_id: must have required property 'user_id'/,
			);
		});
		it.todo("should have a hashed_code");
		it.todo("should have timestamps");
	});

	describe("hooks", () => {
		describe("beforeInsert", () => {
			it.todo("should hash the code");
			it.todo("should prefill the created_at and updated_at datetime fields");
			it.todo("should clear the plaintext code");
			it.todo("should throw an error if code is missing");
		});
	});

	describe("static methods", () => {
		describe("#verify", () => {
			describe("when provided a valid recovery code that has not been used", () => {
				it.todo("should return true");
				it.todo("should mark the recovery code as used");
			});

			describe("when provided a valid recovery code that has already been used", () => {
				it.todo("should return false");
			});

			describe("when provided an invalid recovery code", () => {
				it.todo("should return false");
			});
		});

		describe("#markAsUsed", () => {
			it.todo("should set the used_at timestamp");
		});

		describe(".generateCodes", () => {
			it.todo("should generate an array of 10 unique recovery codes");
		});
	});
});
