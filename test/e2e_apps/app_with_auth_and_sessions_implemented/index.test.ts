// Dependencies
import { join } from "node:path";
import fastifyCookie from "@fastify/cookie";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	removeDatabaseFileIfExists,
	runMigrations,
} from "../app_for_password_in_separate_table/utils/manageDatabase";
import auth from "./auth";
import config from "./config";
import appDB from "./db"; // Assuming you have a db module to handle database connections
import app from "./index";
import { Session } from "./models/Session";
import { User } from "./models/User";
import { afterEach } from "node:test";

const port = 3000; // Port for the Fastify server
const baseUrl = `http://localhost:${port}`;
const signupUrl = `${baseUrl}/signup`;
const loginUrl = `${baseUrl}/login`;
const profileUrl = `${baseUrl}/profile`;
const logoutUrl = `${baseUrl}/logout`;

describe("App with Auth and Sessions Implemented", () => {
	// I think this hook might need to happen somewhere else before all other tests run
	beforeAll(async () => {
		const dbPath = join(
			import.meta.dirname,
			"..",
			"..",
			"..",
			"test",
			"e2e_apps",
			"app_with_auth_and_sessions_implemented",
			"database.sqlite",
		);

		// Delete the database.sqlite file (if it exists)
		await removeDatabaseFileIfExists(dbPath);
		// Run the knex migrations to create the database schema
		await runMigrations(config.db);
		await app.listen({ port });
	});

	beforeEach(async () => {
		await Session.query().delete();
		await User.query().delete();
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

	describe("POST /login", () => {
		describe("when the login details are valid", () => {
			describe("and the client is authenticating via API method", () => {
				it("should authenticate the user successfully", async () => {
					const user = await User.query().insert({
						username: "testuser4",
						email: "testuser4@example.com",
						password: "Password123!",
					});

					const requestData = {
						identifier: "testuser4",
						password: "Password123!",
					};

					const response = await fetch(loginUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestData),
					});

					expect(response.status).toBe(201);
					const data = await response.json();
					expect(data).toHaveProperty("access_token");
					expect(data).toHaveProperty("refresh_token");
					expect(data).toHaveProperty("access_token_expires_at");
					expect(data).toHaveProperty("refresh_token_expires_at");

					const session = await Session.query().findOne({
						user_id: user.id,
						access_token: data.access_token,
					});
					expect(session).toBeDefined();
					expect(session?.user_id).toBe(user.id);
					expect(session?.access_token).toBe(data.access_token);
				});
			});

			describe("when the client is authenticated via a website", () => {
				it("should set tokens in the cookie instead", async () => {
					const user = await User.query().insert({
						username: "testuser6",
						email: "testuser6@example.com",
						password: "Password123!",
					});

					const requestData = {
						identifier: "testuser6",
						password: "Password123!",
					};

					const response = await fetch(loginUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"X-Client-Type": "web", // Simulating a web client
						},
						body: JSON.stringify(requestData),
					});

					expect(response.status).toBe(201);
					const data = await response.text();
					expect(data).toBe("Authenticated successfully");

					const session = await Session.query().findOne({
						user_id: user.id,
					});
					expect(session).toBeDefined();
					expect(session?.access_token).toBeDefined();
					expect(session?.refresh_token).toBeDefined();

					const setCookieHeader = response.headers.get("set-cookie");
					expect(setCookieHeader).toBeDefined();
					expect(setCookieHeader).toContain("access_token");
					expect(setCookieHeader).toContain("refresh_token");

					const cookies = fastifyCookie.parse(setCookieHeader || "");
					expect(cookies.access_token).toStrictEqual(session?.access_token);
					expect(cookies["Max-Age"]).toStrictEqual(
						auth.accessTokenExpiresIn.toString(),
					);
					// We don't see the refresh token in the cookies because it's only accessible for the refresh endpoint
					expect(cookies).not.toHaveProperty("refresh_token");
				});
			});
		});

		describe("when the login details are invalid", () => {
			it("should return an error if the username is not provided", async () => {
				const requestData = {
					password: "Password123!",
				};

				const response = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});

				expect(response.status).toBe(401);
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe(
					"Please provide your username or email address",
				);
			});
			it("should return an error if the password is not provided", async () => {
				const requestData = {
					identifier: "testuser",
				};
				const response = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});
				expect(response.status).toBe(401);
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("Password is required");
			});
			it("should return an error if the user does not exist", async () => {
				const requestData = {
					identifier: "nonexistentuser",
					password: "Password123!",
				};
				const response = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});
				expect(response.status).toBe(401);
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("User not found");
			});
			it("should return an error if the password is incorrect", async () => {
				await User.query().insert({
					username: "testuser5",
					email: "testuser4@example.com",
					password: "Password123!",
				});

				const requestData = {
					identifier: "testuser5",
					password: "WrongPassword!",
				};
				const response = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestData),
				});
				expect(response.status).toBe(401);
				const data = await response.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("Password incorrect");
			});
		});
	});

	describe("GET /profile", () => {
		describe("when the user is authenticated", () => {
			describe("and the client is authenticated via API method", () => {
				it("should return the user's profile information", async () => {
					const user = await User.query().insert({
						username: "testuser8",
						email: "testuser8@example.com",
						password: "Password123!",
					});

					const requestData = {
						identifier: "testuser8",
						password: "Password123!",
					};

					// Perform the login to get the access token
					const response = await fetch(loginUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestData),
					});
					const data = await response.json();
					expect(response.status).toBe(201);
					const { access_token } = data;

					const profileRequest = await fetch(profileUrl, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${access_token}`,
						},
					});

					expect(profileRequest.status).toBe(200);
					const profileData = await profileRequest.json();
					expect(profileData.id).toBe(user.id);
					expect(profileData.username).toBe(user.username);
					expect(profileData.email).toBe(user.email);
				});
			});

			describe("when the client is authenticated via a website", () => {
				it("should return the user's profile information", async () => {
					const user = await User.query().insert({
						username: "testuser10",
						email: "testuser10@example.com",
						password: "Password123!",
					});

					const requestData = {
						identifier: "testuser10",
						password: "Password123!",
					};

					// Perform the login to get the access token
					const response = await fetch(loginUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"X-Client-Type": "web", // Simulating a web client
						},
						body: JSON.stringify(requestData),
					});
					const cookie = response.headers.get("Set-Cookie") || "";
					const data = await response.text();
					expect(data).toBe("Authenticated successfully");
					expect(response.status).toBe(201);

					// TODO - how do we do the cookie stuff? - I think we need to use the cookie-jar library mentioned by ChatGPT
					const profileRequest = await fetch(profileUrl, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							Cookie: cookie,
						},
					});

					const profileData = await profileRequest.json();
					expect(profileRequest.status).toBe(200);
					expect(profileData.id).toBe(user.id);
					expect(profileData.username).toBe(user.username);
					expect(profileData.email).toBe(user.email);
				});
			});
		});

		describe("when there is no access token in the headers or cookies", () => {
			it("should return an error indicating the user is not authenticated", async () => {
				const profileRequest = await fetch(profileUrl, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});
				expect(profileRequest.status).toBe(401);
				const data = await profileRequest.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("Unauthorized");
			});
		});

		describe("when the access token is invalid", () => {
			it("should return an error indicating the session is invalid", async () => {
				const profileRequest = await fetch(profileUrl, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer invalid_token`,
					},
				});
				expect(profileRequest.status).toBe(401);
				const data = await profileRequest.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("Invalid session");
			});
		});

		describe("when the access token has expired", () => {
			it("should return an error indicating the session is invalid", async () => {
				const user = await User.query().insert({
					username: "testuser9",
					email: "testuser9@example.com",
					password: "Password123!",
				});

				const session = await Session.query().insert({
					user_id: user.id,
					...Session.generateTokens(),
				});

				vi.useFakeTimers(); // Enables fake timers
				vi.advanceTimersByTime(1000 * 60 * 60); // Simulate 1 hour passing

				const profileRequest = await fetch(profileUrl, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${session.access_token}`,
					},
				});
				expect(profileRequest.status).toBe(401);
				const data = await profileRequest.json();
				expect(data).toHaveProperty("error");
				expect(data.error).toBe("Access token has expired");

				vi.useRealTimers();
			});
		});
	});

	describe("POST /logout", () => {
		afterEach(async () => {
			await Session.query().delete();
			await User.query().delete();
		});

		describe("when the user is authenticated via API client type", () => {
			it("should log out the user and delete the session", async () => {
				const user = await User.query().insert({
					username: "testuser11",
					email: "testuser11@example.com",
					password: "Password123!",
				});

				const session = await Session.query().insert({
					user_id: user.id,
					...Session.generateTokens(),
				});

				const response = await fetch(logoutUrl, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${session.access_token}`,
					},
				});
				expect(response.status).toBe(200);
				const data = await response.json();
				expect(data).toHaveProperty("message");
				expect(data.message).toBe("Logged out successfully");
				const nonExistentSession = await Session.query().findById(session.id);
				expect(nonExistentSession).toBeUndefined(); // Session should be deleted
			});

			it.todo(
				"should delete only the session with the matching access token, and not all sessions for the user that might be active",
			);
		});

		describe("when the user is authenticated via Web client type", () => {
			it.todo(
				"should log out the user, delete the session, and clear the cookies",
			);
		});

		describe("when the user is not authenticated", () => {
			it("should return a 200");
		});
	});
});
