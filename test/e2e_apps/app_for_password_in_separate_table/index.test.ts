/*
 What do I want to test?

 I want to test the following scenarios:

 - [x] When creating a user, if the password is not valid, attempting to save results in an error.
 - [ ] When creating a user, if the password is valid:
        - [ ] the user is created successfully.
        - [ ] the password is hashed and stored in the database in a separate table.
        - [ ] the password record is linked to the user record.
        - [ ] I have a way to authenicate the user with their password
        - [ ] If their password is not valid, then the user is not authenticated.

*/

import { beforeEach, describe, expect, it } from "vitest";
import User from "./models/User";

describe("E2E Tests for User Creation and Password Handling with passwords stored in separate table", () => {
	beforeEach(async () => {
		await User.query().delete();
	});

	describe("validating the user's password", () => {
		describe("when the password is not valid", () => {
			it("should not allow user creation and return an error", async () => {
				const createInvalidUser = async () => {
					return await User.query().insert({
						username: "testuser",
						password: "short", // Invalid password as it is too short and doesn't comply with password validation rules
					});
				};

				expect(() => createInvalidUser()).rejects.toThrowError(
					"Password does not meet validation rules",
				);
				// So, if we want to test different settings for auth, we will need separate User models for each setting
			});
		});

		describe("when the password is valid", () => {
			it("should create the user successfully", async () => {
				const createValidUser = async () => {
					return await User.query().insert({
						username: "testuser",
						password: "ValidPassword123!", // Valid password
					});
				};

				await expect(createValidUser()).resolves.toBeDefined();
				const user = await User.query().findOne({ username: "testuser" });
				expect(user).toBeDefined();
				expect(user?.username).toBe("testuser");
			});
		});
	});
});
