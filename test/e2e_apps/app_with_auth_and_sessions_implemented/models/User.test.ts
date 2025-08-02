// Dependencies
import { UniqueViolationError } from "objection";
import { beforeEach, describe, expect, it } from "vitest";
import isIsoString from "../helpers/isIsoString";
import { User } from "./User";

describe("User model", () => {
	beforeEach(async () => {
		await User.query().delete();
	});

	const invalidUser = async (parameters) => {
		return await User.query().insert(parameters);
	};

	describe("validations", () => {
		it("should have a username", async () => {
			const parameters = {
				email: "testuser@example.com",
				password: "ValidPassword123!",
			};
			await expect(invalidUser(parameters)).rejects.toThrowError(
				"username: must have required property 'username'",
			);
		});
		it("should have a valid username", async () => {
			const parameters = {
				username: "!!!",
				email: "testuser@example.com",
				password: "ValidPassword123!",
			};
			await expect(invalidUser(parameters)).rejects.toThrowError(
				'username: must match pattern "^([\\w\\d]){1,255}$"',
			);
		});
		it("should have a unique username", async () => {
			// 1 - Create a valid user
			await User.query().insert({
				username: "uniqueuser",
				email: "testuser@example.com",
				password: "ValidPassword123!",
			});

			// 2 - Create another user with the same username
			const secondUserParameters = {
				username: "uniqueuser",
				email: "testuser2@example.com",
				password: "ValidPassword123!",
			};

			// 3 - Verify that an error makes it clear that you can't insert the same username
			await expect(invalidUser(secondUserParameters)).rejects.toThrowError(
				UniqueViolationError,
			);
		});

		it("should have an email", async () => {
			const parameters = {
				username: "testuser",
				password: "ValidPassword123!",
			};
			await expect(invalidUser(parameters)).rejects.toThrowError(
				"email: must have required property 'email'",
			);
		});
		it("should have a valid email", async () => {
			const parameters = {
				username: "testuser",
				email: "invalid-email",
				password: "ValidPassword123!",
			};
			await expect(invalidUser(parameters)).rejects.toThrowError(
				'email: must match format "email", must match pattern "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"',
			);
		});
		it("should have a unique email", async () => {
			// 1 - Create a valid user
			await User.query().insert({
				username: "uniqueuser",
				email: "testuser@example.com",
				password: "ValidPassword123!",
			});

			// 2 - Create another user with the same email
			const secondUserParameters = {
				username: "uniqueuser2",
				email: "testuser@example.com",
				password: "ValidPassword123!",
			};

			// 3 - Verify that an error makes it clear that you can't insert the same email
			await expect(invalidUser(secondUserParameters)).rejects.toThrowError(
				UniqueViolationError,
			);
		});
		it("should have a password, when passed into the insert method", async () => {
			const parameters = {
				username: "testuser",
				email: "testuser@example.com",
			};
			await expect(invalidUser(parameters)).rejects.toThrowError(
				"Password is required",
			);
		});
		it("should have a valid password", async () => {
			const parameters = {
				username: "testuser",
				email: "testuser@example.com",
				password: "short",
			};
			await expect(invalidUser(parameters)).rejects.toThrowError(
				"Password does not meet validation rules",
			);
		});

		it("should have a created_at timestamp", async () => {
			const user = await User.query().insert({
				username: "testuser",
				email: "testuser@example.com",
				password: "ValidPassword123!",
			});

			expect(user.created_at).toBeDefined();
			expect(isIsoString(user.created_at)).toBe(true);
		});
		it("should have an updated_at timestamp", async () => {
			const user = await User.query().insert({
				username: "testuser",
				email: "testuser@example.com",
				password: "ValidPassword123!",
			});

			expect(user.updated_at).toBeDefined();
			expect(isIsoString(user.updated_at)).toBe(true);
		});
	});

	describe("hooks", () => {
		describe("before inserting a new record", () => {
			it("should set created_at and updated_at timestamps before insert", async () => {
				const user = await User.query().insert({
					username: "testuser",
					email: "testuser@example.com",
					password: "ValidPassword123!",
				});
				expect(user.created_at).toBeDefined();
				expect(isIsoString(user.created_at)).toBe(true);
				expect(user.updated_at).toBeDefined();
				expect(isIsoString(user.updated_at)).toBe(true);
			});

			it("should generate a hashed_password from the password field passed in", async () => {
				const user = await User.query().insert({
					username: "testuser",
					email: "testuser@example.com",
					password: "ValidPassword123!",
				});
				expect(user.hashed_password).toBeDefined();
				expect(user.hashed_password).not.toBe("ValidPassword123!");
			});
		});

		describe("before updating an existing record", () => {
			it("should update the updated_at timestamp", async () => {
				const user = await User.query().insert({
					username: "testuser",
					email: "testuser@example.com",
					password: "ValidPassword123!",
				});
				const originalUpdatedAt = user.updated_at;
				await user.$query().patch({ username: "updateduser" });
				expect(user.updated_at).toBeDefined();
				expect(isIsoString(user.updated_at)).toBe(true);
				expect(user.updated_at).not.toBe(originalUpdatedAt);
			});
		});
	});

	describe("static methods", () => {
		describe("authenticate", () => {
			describe("when the credentials are valid", () => {
				it("should allow the user to authenticate with their username and password", async () => {
					const user = await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
						password: "ValidPassword123!",
					});
					const isAuthenticated = await User.authenticate({
						identifier: user.username,
						password: "ValidPassword123!",
					});
					expect(isAuthenticated).toStrictEqual({
						id: user.id,
						username: user.username,
					});
				});
				it("should allow the user to authenticate with their email and password", async () => {
					const user = await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
						password: "ValidPassword123!",
					});
					const isAuthenticated = await User.authenticate({
						identifier: user.email,
						password: "ValidPassword123!",
					});
					expect(isAuthenticated).toStrictEqual({
						id: user.id,
						username: user.username,
					});
				});
			});

			describe("when the credentials are invalid", () => {
				it("should not allow the user to authenticate with an invalid identifier and password", async () => {
					await expect(
						User.authenticate({
							identifier: null,
							password: "ValidPassword123!",
						}),
					).rejects.toThrowError("User not found");
					await expect(
						User.authenticate({
							identifier: "*",
							password: "ValidPassword123!",
						}),
					).rejects.toThrowError("User not found");
				});
				it("should throw an error if the user is not found", async () => {
					await expect(
						User.authenticate({
							identifier: "nonexistentuser",
							password: "ValidPassword123!",
						}),
					).rejects.toThrowError("User not found");
				});
			});
		});
	});

	describe("instance methods", () => {
		describe("clearPlaintextPassword", () => {
			it("should remove the plaintext password from the user object", async () => {
				const user = await User.query().insert({
					username: "testuser",
					email: "testuser@example.com",
					password: "ValidPassword123!",
				});
				user.clearPlaintextPassword();
				expect(user.password).toBeUndefined();
			});
		});
	});
});
