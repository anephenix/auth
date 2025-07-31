import { describe, it } from "vitest";

describe("App with Auth and Sessions Implemented", () => {
	describe("POST /signup", () => {
		describe("when the signup details are valid", () => {
			it.todo("should create a new user");
			// Question - should we create a session for the user automatically after signup?
			// Let's say for example that someone wants to create a user account and we want to verify that they are a human.
			// We could wait for them to verify their email address before creating a session - after all, they could be a bot.
			// I think this depends on the use case - whether we need to verify the person before they use the app, and that we have a reason to prevent bots (such as spam and scammers)
			it.todo(
				"can create a session for the user so that they are logged in automatically after signup",
			);
		});

		describe("when the signup details are invalid", () => {
			it.todo("should return an error if the username is not provided");
			it.todo(
				"should return an error if the username does not meet validation rules",
			);
			it.todo("should return an error if the username is already taken");
			it.todo("should return an error if the email is not provided");
			it.todo("should return an error if the email is not valid");
			it.todo("should return an error if the email is already taken");
			it.todo("should return an error if the password is not provided");
			it.todo(
				"should return an error if the password does not meet validation rules",
			);
		});
	});
});
