import { join } from "node:path";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { isHashed } from "../../utils/comparators";
import config from "./config";
import Password from "./models/Password";
import User from "./models/User";
import {
	removeDatabaseFileIfExists,
	runMigrations,
} from "./utils/manageDatabase";

describe("E2E Tests for User Creation and Password Handling with passwords stored in separate table", () => {
	beforeAll(async () => {
		const dbPath = join(
			import.meta.dirname,
			"..",
			"..",
			"..",
			"test",
			"e2e_apps",
			"app_for_password_in_separate_table",
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

	describe("When creating a user", () => {
		describe("validating the user's password", () => {
			describe("when the password is not valid", () => {
				it("should not allow user creation and return an error", async () => {
					const createInvalidUser = async () => {
						return await User.transaction(async (trx) => {
							const user = await User.query(trx).insert({
								username: "testuser",
							});

							const invalidPassword = await user
								.$relatedQuery("passwords", trx)
								.insert({ password: "short" });

							return invalidPassword;
						});
					};

					await expect(createInvalidUser()).rejects.toThrowError(
						"Password does not meet validation rules",
					);
				});
			});

			describe("when the password is valid", () => {
				it("should create the user successfully", async () => {
					// We would create the user and the password in a transaction, so that either both are created or neither is created.
					const createValidUser = async () => {
						try {
							return await User.transaction(async (trx) => {
								const user = await User.query(trx).insert({
									username: "testuser",
								});

								const validPassword = await user
									.$relatedQuery("passwords", trx)
									.insert({ password: "ValidPassword123!" });
								return validPassword;
							});
						} catch (err) {
							console.log("An error occurred creating the password");
							throw err;
						}
					};

					await expect(createValidUser()).resolves.toBeTruthy();
					const user = await User.query().findOne({ username: "testuser" });
					expect(user?.username).toBe("testuser");
					const passwords = await user?.$relatedQuery("passwords");
					expect(passwords).toHaveLength(1);
					const password = passwords?.[0] as Password;
					expect(password.password).not.toBeDefined();
					expect(isHashed(password.hashed_password)).toBe(true);
					expect(password.hashed_password).not.toBe("ValidPassword123!");
				});
			});
		});
	});

	describe("Authenticating a user with their password", () => {
		describe("when the user exists and the password is correct", () => {
			it("should authenticate the user successfully", async () => {
				const createValidUser = async () => {
					return await User.transaction(async (trx) => {
						const user = await User.query(trx).insert({
							username: "testuser",
						});

						await user
							.$relatedQuery("passwords", trx)
							.insert({ password: "ValidPassword123!" });
						return user;
					});
				};

				await createValidUser();
				const authenticatedUser = await User.authenticate({
					identifier: "testuser",
					password: "ValidPassword123!",
				});
				expect(authenticatedUser.username).toBe("testuser");
			});
		});

		describe("when the user exists but the password is incorrect", () => {
			it("should not authenticate the user and throw an error", async () => {
				const createValidUser = async () => {
					return await User.transaction(async (trx) => {
						const user = await User.query(trx).insert({
							username: "testuser",
						});

						await user
							.$relatedQuery("passwords", trx)
							.insert({ password: "ValidPassword123!" });
						return user;
					});
				};

				await createValidUser();

				await expect(
					User.authenticate({
						identifier: "testuser",
						password: "WrongPassword!",
					}),
				).rejects.toThrowError("Password incorrect");
			});
		});

		describe("when the user does not exist", () => {
			it("should not authenticate and throw an error", async () => {
				await expect(
					User.authenticate({
						identifier: "nonexistentuser",
						password: "SomePassword!",
					}),
				).rejects.toThrowError("User not found");
			});
		});

		describe("when the user has created multiple passwords", () => {
			it("should authenticate with the most recent password", async () => {
				const createUserWithAPassword = async () => {
					return await User.transaction(async (trx) => {
						const user = await User.query(trx).insert({
							username: "testuser",
						});

						await user
							.$relatedQuery("passwords", trx)
							.insert({ password: "FirstPassword123!" });
					});
				};

				await createUserWithAPassword();
				const user = await User.query().findOne({ username: "testuser" });

				const password = await Password.query().insert({
					user_id: user?.id,
					password: "SecondPassword123!",
				});

				const userForPassword = await password.$relatedQuery("user").first();
				expect((userForPassword as User)?.id).toBe((user as User)?.id);

				const authenticatedUser = await User.authenticate({
					identifier: "testuser",
					password: "SecondPassword123!",
				});
				expect(authenticatedUser.username).toBe("testuser");

				const attemptToUseFirstPassword = async () => {
					return await User.authenticate({
						identifier: "testuser",
						password: "FirstPassword123!",
					});
				};

				await expect(attemptToUseFirstPassword()).rejects.toThrowError(
					"Password incorrect",
				);
			});
		});
	});

	// Good edge case to test - in case the user has no passwords at all (perhaps they rely solely on magic links)
	describe("when the user has no passwords", () => {
		it("should not authenticate and throw an error", async () => {
			const createUserWithoutPassword = async () => {
				return await User.query().insert({
					username: "testuser",
				});
			};
			await createUserWithoutPassword();
			await expect(
				User.authenticate({
					identifier: "testuser",
					password: "SomePassword!",
				}),
			).rejects.toThrowError("Password not found for user");
		});
	});

	describe("authenticating a user with their email address instead of their username", () => {
		it("should authenticate the user successfully", async () => {
			const createValidUser = async () => {
				return await User.transaction(async (trx) => {
					const user = await User.query(trx).insert({
						username: "testuser",
						email: "testuser@example.com",
					});

					await user
						.$relatedQuery("passwords", trx)
						.insert({ password: "ValidPassword123!" });
					return user;
				});
			};

			await createValidUser();
			const authenticatedUser = await User.authenticate({
				identifier: "testuser@example.com",
				password: "ValidPassword123!",
			});
			expect(authenticatedUser.username).toBe("testuser");
		});
	});
});
