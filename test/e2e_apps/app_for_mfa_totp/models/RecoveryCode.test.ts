import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	isHashed,
	isIsoString,
	isRandomString,
} from "../../../utils/comparators";
import {
	removeDatabaseFileIfExists,
	runMigrations,
} from "../../app_for_password_in_separate_table/utils/manageDatabase";
import config from "../config";
import appDB from "../db"; // Assuming you have a db module to handle database connections
import { RecoveryCode } from "./RecoveryCode";
import { User } from "./User";

describe("RecoveryCode Model", () => {
	beforeAll(async () => {
		const dbPath = join(
			import.meta.dirname,
			"..",
			"..",
			"..",
			"test",
			"e2e_apps",
			"app_with_mfa_totp",
			"database.sqlite",
		);

		// Delete the database.sqlite file (if it exists)
		await removeDatabaseFileIfExists(dbPath);
		// Run the knex migrations to create the database schema
		await runMigrations(config.db);
	});

	beforeEach(async () => {
		await User.query().delete();
	});

	afterAll(async () => {
		await appDB.destroy();
	});

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
		it("should have a code to then create a hashed_code from", async () => {
			const user = await User.query().insert({
				username: "mfauser",
				email: "mfauser@example.com",
				password: "ValidPassword123!",
				mobile_number: "07711 123456",
			});

			const makeRecoveryCodeWithoutCode = async () => {
				return await RecoveryCode.query().insert({
					user_id: user.id,
				});
			};
			await expect(makeRecoveryCodeWithoutCode).rejects.toThrowError(
				/Code is required/,
			);
		});
	});

	describe("hooks", () => {
		describe("beforeInsert", () => {
			it("should hash the code", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});
				const recoveryCode = await RecoveryCode.query().insert({
					user_id: user.id,
					code: "123456",
				});

				expect(recoveryCode.code).toBeUndefined();
				expect(isHashed(recoveryCode.hashed_code)).toBe(true);
			});
			it("should prefill the created_at and updated_at datetime fields", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});
				const recoveryCode = await RecoveryCode.query().insert({
					user_id: user.id,
					code: "123456",
				});
				expect(isIsoString(recoveryCode.created_at)).toBe(true);
				expect(isIsoString(recoveryCode.updated_at)).toBe(true);
			});

			it("should clear the plaintext code", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});
				const recoveryCode = await RecoveryCode.query().insert({
					user_id: user.id,
					code: "123456",
				});

				expect(recoveryCode.code).toBeUndefined();
			});
		});
	});

	describe("static methods", () => {
		describe("#verify", () => {
			describe("when provided a valid recovery code that has not been used", () => {
				it("should return true", async () => {
					const user = await User.query().insert({
						username: "mfauser",
						email: "mfauser@example.com",
						password: "ValidPassword123!",
						mobile_number: "07711 123456",
					});
					const recoveryCode = await RecoveryCode.query().insert({
						user_id: user.id,
						code: "123456",
					});
					const result = await recoveryCode.verify("123456");
					expect(result).toBe(true);
				});
				it("should mark the recovery code as used", async () => {
					const user = await User.query().insert({
						username: "mfauser",
						email: "mfauser@example.com",
						password: "ValidPassword123!",
						mobile_number: "07711 123456",
					});
					const recoveryCode = await RecoveryCode.query().insert({
						user_id: user.id,
						code: "123456",
					});
					await recoveryCode.verify("123456");
					expect(recoveryCode.used_at).toBeDefined();
					expect(
						recoveryCode.used_at && isIsoString(recoveryCode.used_at),
					).toBe(true);
				});
			});

			describe("when provided a valid recovery code that has already been used", () => {
				it("should return false", async () => {
					const user = await User.query().insert({
						username: "mfauser",
						email: "mfauser@example.com",
						password: "ValidPassword123!",
						mobile_number: "07711 123456",
					});
					const recoveryCode = await RecoveryCode.query().insert({
						user_id: user.id,
						code: "123456",
					});
					await recoveryCode.verify("123456");

					const secondAttempt = await recoveryCode.verify("123456");
					expect(secondAttempt).toBe(false);
				});
			});

			describe("when provided an invalid recovery code", () => {
				it("should return false", async () => {
					const user = await User.query().insert({
						username: "mfauser",
						email: "mfauser@example.com",
						password: "ValidPassword123!",
						mobile_number: "07711 123456",
					});
					const recoveryCode = await RecoveryCode.query().insert({
						user_id: user.id,
						code: "123456",
					});
					const result = await recoveryCode.verify("789012");
					expect(result).toBe(false);
				});
			});
		});

		describe("#markAsUsed", () => {
			it("should set the used_at timestamp", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});
				const recoveryCode = await RecoveryCode.query().insert({
					user_id: user.id,
					code: "123456",
				});
				await recoveryCode.markAsUsed();
				expect(recoveryCode.used_at).toBeDefined();
				expect(recoveryCode.used_at && isIsoString(recoveryCode.used_at)).toBe(
					true,
				);
			});
		});

		describe(".generateCodes", () => {
			it("should generate an array of 10 unique recovery codes", async () => {
				const codes = await RecoveryCode.generateCodes();
				expect(codes).toHaveLength(10);
				codes.forEach((code) => {
					expect(isRandomString(code)).toBe(true);
					expect(codes.filter((c) => c === code)).toHaveLength(1);
				});
			});
		});
	});
});
