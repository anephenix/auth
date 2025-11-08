import { describe, it } from "vitest";

describe("midddleware", () => {
	describe("#authenticateSession", () => {
		describe("when passed an access token that is valid", () => {
			it.todo("should attach the user to the request object");
			it.todo("should also attach the access_token to the request object");
			it.todo("should allow the request to proceed");
		});

		describe("when passed an access token that is invalid", () => {
			it.todo(
				"should not attach the user or the access_token to the request object",
			);
			it.todo("should respond with a 401 Unauthorized status");
		});

		describe("when passed no access token", () => {
			it.todo("should not attach the user to the request object");
			it.todo("should respond with a 401 Unauthorized status");
		});
	});
});
