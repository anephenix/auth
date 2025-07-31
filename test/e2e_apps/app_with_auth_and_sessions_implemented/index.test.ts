// Dependencies
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { Session } from "./models/Session";
import { User } from "./models/User";
import appDB from "./db"; // Assuming you have a db module to handle database connections

const port = 3000; // Port for the Fastify server
const baseUrl = `http://localhost:${port}`;
const signupUrl = `${baseUrl}/signup`;

describe("App with Auth and Sessions Implemented", () => {
	beforeEach(async () => {
		await Session.query().delete();
		await User.query().delete();
	});

	beforeAll(async () => {
		await app.listen({ port });
	});

	afterAll(async () => {
		await app.close();
		await appDB.destroy();
	});

	describe("POST /signup", () => {
		describe("when the signup details are valid", () => {
			it("should create a new user", async () => {
				const requestData = {
					username: "anothertestuser",
					email: "testuser@anotherexample.com",
					password: "Password123!",
				};

				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(201); // Check for 201 Created status
				const data = await response.json();
				expect(data).toHaveProperty("id");
				expect(data).toHaveProperty("username");
				expect(data).toHaveProperty("email");
				expect(data).not.toHaveProperty("password");
				expect(data).not.toHaveProperty("hashed_password");
				expect(data.username).toBe(requestData.username);
				expect(data.email).toBe(requestData.email); // Check that the user was created in the database
				const user = await User.query().findById(data.id);
				expect(user).toBeDefined();
				expect(user?.username).toBe(requestData.username);
				expect(user?.email).toBe(requestData.email);
				expect(user?.hashed_password).toBeDefined();
				expect(user?.hashed_password).not.toBe(requestData.password);
			});
		});

		describe("when the signup details are invalid", () => {
			it("should return an error if the username is not provided", async () => {
				const requestData = {
					email: "testuser@anotherexample.com",
					password: "Password123!",
				};

				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(400); // Check for 400 Bad Request status
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe(
					"username: must have required property 'username'",
				);
			});
			it("should return an error if the username does not meet validation rules", async () => {
				const requestData = {
					username: "MrBangBang!!",
					email: "testuser@anotherexample.com",
					password: "Password123!",
				};

				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});
				expect(response.status).toBe(400); // Check for 400 Bad Request status
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe(
					`username: must match pattern "^([\\w\\d]){1,255}$"`,
				);
			});
			it("should return an error if the username is already taken", async () => {
				const requestData = {
					username: "testuser",
					email: "testuser@anotherexample.com",
					password: "Password123!",
				};
				const secondRequestData = {
					username: "testuser",
					email: "testuser+2@anotherexample.com",
					password: "Password123!",
				};

				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(201);

				// Then try and create the same user again
				const duplicateResponse = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(secondRequestData),
				});
				expect(duplicateResponse.status).toBe(400); // Check for 400 Bad Request status
				const duplicateData = await duplicateResponse.json();
				expect(duplicateData).toHaveProperty("error");
				expect(duplicateData.error).toBe("username already exists.");
			});

			it("should return an error if the email is not provided", async () => {
				const requestData = {
					username: "testuser",
					password: "Password123!",
				};

				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(400); // Check for 400 Bad Request status
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("email: must have required property 'email'");
			});

			it("should return an error if the email is not valid", async () => {
				const requestData = {
					username: "testuser",
					email: "invalid-email",
					password: "Password123!",
				};

				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(400); // Check for 400 Bad Request status
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe(
					'email: must match format "email", must match pattern "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"',
				);
			});

			it("should return an error if the email is already taken", async () => {
				const requestData = {
					username: "testuser2",
					email: "testuser@anotherexample.com",
					password: "Password123!",
				};
				const secondRequestData = {
					username: "testuser",
					email: "testuser@anotherexample.com",
					password: "Password123!",
				};

				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(201);

				// Then try and create the same user again
				const duplicateResponse = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(secondRequestData),
				});
				expect(duplicateResponse.status).toBe(400); // Check for 400 Bad Request status
				const duplicateData = await duplicateResponse.json();
				expect(duplicateData).toHaveProperty("error");
				expect(duplicateData.error).toBe("email already exists.");
			});
			it("should return an error if the password is not provided", async () => {
				const requestData = {
					username: "testuser3",
					email: "testuser3@example.com",
				};
				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(400); // Check for 400 Bad Request status
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("Password is required");
			});
			it("should return an error if the password does not meet validation rules", async () => {
				const requestData = {
					username: "testuser3",
					email: "testuser3@example.com",
					password: "short",
				};

				const response = await fetch(signupUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(400); // Check for 400 Bad Request status
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("Password does not meet validation rules");
			});
		});
	});
});
