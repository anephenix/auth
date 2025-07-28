/*
 What do I want to test?

 I want to test the following scenarios:

 - [x] When creating a user, if the password is not valid, attempting to save results in an error.
 - [ ] When creating a user, if the password is valid:
        - [x] the user is created successfully.
        - [x] the password is hashed and stored in the database in a separate table.
        - [x] the password record is linked to the user record.
        - [ ] I have a way to authenicate the user with their password
        - [ ] If their password is not valid, then the user is not authenticated.

*/

import { beforeEach, describe, expect, it } from "vitest";
import User from "./models/User";
import Password from "./models/Password";

describe("E2E Tests for User Creation and Password Handling with passwords stored in separate table", () => {
	beforeEach(async () => {
		await User.query().delete();
	});

	describe("validating the user's password", () => {
		describe("when the password is not valid", () => {
			it("should not allow user creation and return an error", async () => {
				const createInvalidUser = async () => {
					try {
						return await User.transaction(async (trx) => {
							const user = await User.query(trx).insert({
								username: "testuser",
							});

							const invalidPassword = await user
								.$relatedQuery("passwords", trx)
								.insert({ password: "short" });

							return invalidPassword;
						});
					} catch (err) {
						console.log("An error occurred creating the password");
						throw err;
					}
				};

				expect(() => createInvalidUser()).rejects.toThrowError(
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

				await expect(createValidUser()).resolves.toBeDefined();
				const user = await User.query().findOne({ username: "testuser" });
				expect(user).toBeDefined();
				expect(user?.username).toBe("testuser");
				const passwords = await user?.$relatedQuery("passwords");
				expect(passwords).toHaveLength(1);
				const password = passwords?.[0] as Password;
				expect(password.password).not.toBeDefined();
				expect(password.hashed_password).toBeDefined();
				expect(password.hashed_password).not.toBe("ValidPassword123!");
			});
		});
	});
});
