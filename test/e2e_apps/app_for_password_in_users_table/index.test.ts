import { beforeEach, describe, expect, it } from "vitest";
import User from "./models/User";

/*
 What do I want to test?

 I want to test the following scenarios:

 - [x] When creating a user, if the password is not valid, attempting to save results in an error.
 - [x] When creating a user, if the password is valid:
        - [x] the user is created successfully.
        - [x] the password is hashed and stored in the database in the users table.
        - [x] I have a way to authenticate the user with their password
        - [x] If their password is not valid, then the user is not authenticated.
*/

describe("E2E Tests for User Creation and Password Handling with the password stored in the users table", () => {
	beforeEach(async () => {
		await User.query().delete();
	});

	describe("When creating a user", () => {
		describe("validating the user's password", () => {
			describe("when the password is not valid", () => {
				it("should not allow user creation and return an error", async () => {
					const createInvalidUser = async () => {
						try {
							return await User.query().insert({
								username: "testuser",
								password: "short",
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
					const createValidUser = async () => {
						try {
							return await User.query().insert({
								username: "testuser",
								password: "ValidPassword123!",
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
					expect(user?.password).not.toBeDefined();
					expect(user?.hashed_password).toBeDefined();
					expect(user?.hashed_password).not.toBe("ValidPassword123!");
				});
			});
		});
	});

	describe("Authenticating a user with their password", () => {
		describe("when the user exists and the password is correct", () => {
			it("should authenticate the user successfully", async () => {
				const createValidUser = async () => {
					return await User.query().insert({
						username: "testuser",
						password: "ValidPassword123!",
					});
				};

				await createValidUser();
				const authenticatedUser = await User.authenticate({
					identifier: "testuser",
					password: "ValidPassword123!",
				});
				expect(authenticatedUser).toBeDefined();
				expect(authenticatedUser.username).toBe("testuser");
			});
		});

		describe("when the user exists but the password is incorrect", () => {
			it("should not authenticate the user and throw an error", async () => {
				const createValidUser = async () => {
					return await User.query().insert({
						username: "testuser",
						password: "ValidPassword123!",
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
	});
});
