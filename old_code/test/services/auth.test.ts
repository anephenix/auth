import { describe, it } from "vitest";

describe("Auth service", () => {
	describe("initialization", () => {
		it.todo("should initialize the service");
	});

	describe("#login", () => {
		describe("when the username and/or password are not provided", () => {
			it.todo(
				"should throw an error about the username and password being required",
			);
		});

		describe("when the username and password are correct", () => {
			it.todo("should create a session");

			it.todo("should return a payload with the session id and token");
		});

		describe("when the username is not found", () => {
			it.todo("should throw an error about the user not being found");
		});

		describe("when the password is incorrect", () => {
			it.todo("should throw an error about the password being incorrect");
		});
	});
});
