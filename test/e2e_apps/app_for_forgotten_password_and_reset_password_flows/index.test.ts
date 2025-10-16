import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	removeDatabaseFileIfExists,
	runMigrations,
} from "../app_for_password_in_separate_table/utils/manageDatabase";
import auth from "./auth";
import config from "./config";
import appDB from "./db"; // Assuming you have a db module to handle database connections
import app from "./index";
import ForgotPassword from "./models/ForgotPassword";
import User from "./models/User";
import emailQueue from "./queues/EmailQueue";
import forgotPasswordRequestQueue from "./queues/ForgotPasswordRequestQueue";
import forgotPasswordRequestWorker from "./workers/ForgotPasswordRequestWorker";

const port = 3000;
const baseUrl = "http://localhost:3000";
const forgotPasswordUrl = `${baseUrl}/forgot-password`;

describe("Forgot Password and Reset Password Flows", () => {
	beforeAll(async () => {
		const dbPath = join(
			import.meta.dirname,
			"..",
			"..",
			"..",
			"test",
			"e2e_apps",
			"app_for_forgotten_password_and_reset_password_flows",
			"database.sqlite",
		);

		// Delete the database.sqlite file (if it exists)
		await removeDatabaseFileIfExists(dbPath);
		// Run the knex migrations to create the database schema
		await runMigrations(config.db);
		await forgotPasswordRequestQueue.flushAll();
		await app.listen({ port });
	});

	afterAll(async () => {
		await app.close();
		await appDB.destroy();
	});

	describe("Making a forgotten password request", () => {
		describe("success cases", () => {
			describe("when requesting with a username", () => {
				let user: User;
				let forgotPasswordAPIRequest: Response;

				beforeAll(async () => {
					await ForgotPassword.query().delete();
					await User.query().delete();
					// Create a user in the database to test against
					user = await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
						password: "Password123!",
					});

					const identifier = "testuser";
					forgotPasswordAPIRequest = await fetch(forgotPasswordUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							identifier,
						}),
					});
				});

				it("should respond with a 200 success", async () => {
					expect(forgotPasswordAPIRequest.status).toBe(200);
				});

				it("should create a job in the queue to check that the record exists", async () => {
					const job = await forgotPasswordRequestQueue.inspect();
					expect(job).not.toBeNull();
					expect(job?.data?.identifier).toBe("testuser");
					expect(job?.data?.isEmail).toBe(false);
				});

				it("should create a forgotPassword record in the database linked to the user if a user with that username exists", async () => {
					await forgotPasswordRequestWorker.start();
					const forgotPasswordRecord = await ForgotPassword.query()
						.where({ user_id: user.id })
						.first();
					expect(forgotPasswordRecord).not.toBeUndefined();
					expect(forgotPasswordRecord?.user_id).toBe(user.id);
					expect(forgotPasswordRecord?.expires_at).toBeDefined();
					expect(forgotPasswordRecord?.used_at).toBe(null);
				});

				it("should create an email on the email queue with the details needed for the user to access the forgotten_password password reset option", async () => {
					const job = await emailQueue.inspect();
					expect(job).not.toBeNull();
					expect(job?.name).toBe("send-forgot-password-email");
					expect(job?.data?.to).toBe("testuser@example.com");
					const token = job?.data?.token;
					expect(token).toBeDefined();

					const forgotPasswordRecord = await ForgotPassword.query()
						.where({ user_id: user.id })
						.first();
					expect(forgotPasswordRecord).not.toBeUndefined();
					if (!forgotPasswordRecord)
						throw new Error("No forgotPassword record found");
					const isValid = await auth.verifyPassword(
						token,
						forgotPasswordRecord.token_hash,
					);
					expect(isValid).toBe(true);
				});
			});

			describe("when requesting with an email", () => {
				let user: User;
				let forgotPasswordAPIRequest: Response;

				beforeAll(async () => {
					await ForgotPassword.query().delete();
					await User.query().delete();
					// Create a user in the database to test against
					user = await User.query().insert({
						username: "testusertwo",
						email: "testusertwo@example.com",
						password: "Password123!",
					});

					const identifier = "testusertwo@example.com";
					forgotPasswordAPIRequest = await fetch(forgotPasswordUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							identifier,
						}),
					});
				});

				it("should respond with a 200 success", async () => {
					expect(forgotPasswordAPIRequest.status).toBe(200);
				});

				it("should create a job in the queue to check that the record exists", async () => {
					const job = await forgotPasswordRequestQueue.inspect();
					expect(job).not.toBeNull();
					expect(job?.data?.identifier).toBe("testusertwo@example.com");
					expect(job?.data?.isEmail).toBe(true);
				});

				it("should create a forgotPassword record in the database linked to the user if a user with that email exists", async () => {
					await forgotPasswordRequestWorker.start();
					const forgotPasswordRecord = await ForgotPassword.query()
						.where({ user_id: user.id })
						.first();
					expect(forgotPasswordRecord).not.toBeUndefined();
					expect(forgotPasswordRecord?.user_id).toBe(user.id);
					expect(forgotPasswordRecord?.expires_at).toBeDefined();
					expect(forgotPasswordRecord?.used_at).toBe(null);
					await forgotPasswordRequestWorker.stop();
				});

				it("should create an email on the email queue with the details needed for the user to access the forgotten_password password reset option", async () => {
					const job = await emailQueue.inspect();
					expect(job).not.toBeNull();
					expect(job?.name).toBe("send-forgot-password-email");
					expect(job?.data?.to).toBe("testusertwo@example.com");
					const token = job?.data?.token;
					expect(token).toBeDefined();

					const forgotPasswordRecord = await ForgotPassword.query()
						.where({ user_id: user.id })
						.first();
					expect(forgotPasswordRecord).not.toBeUndefined();
					if (!forgotPasswordRecord)
						throw new Error("No forgotPassword record found");
					const isValid = await auth.verifyPassword(
						token,
						forgotPasswordRecord.token_hash,
					);
					expect(isValid).toBe(true);
				});
			});
		});

		describe("fail cases", () => {
			describe("when the username does not exist", () => {
				let forgotPasswordAPIRequest: Response;

				beforeAll(async () => {
					await ForgotPassword.query().delete();
					await User.query().delete();
					// Create a user in the database to test against
					await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
						password: "Password123!",
					});

					const identifier = "nonexistentuser";
					forgotPasswordAPIRequest = await fetch(forgotPasswordUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							identifier,
						}),
					});
				});

				it("should respond with the same status as if the user exists, so that account discovery attacks are not possible", () => {
					expect(forgotPasswordAPIRequest.status).toBe(200);
				});

				it("should create a job in the queue to check that the record exists", async () => {
					const job = await forgotPasswordRequestQueue.inspect();
					expect(job).not.toBeNull();
					expect(job?.data?.identifier).toBe("nonexistentuser");
					expect(job?.data?.isEmail).toBe(false);
				});

				it("should not create a forgotPassword record in the database as no user with that username exists", async () => {
					await forgotPasswordRequestWorker.start();
					const forgotPasswordRecordCount =
						await ForgotPassword.query().resultSize();
					expect(forgotPasswordRecordCount).toBe(0);
					await forgotPasswordRequestWorker.stop();
				});
			});

			describe("when the email address does not exist", () => {
				let forgotPasswordAPIRequest: Response;

				beforeAll(async () => {
					await ForgotPassword.query().delete();
					await User.query().delete();
					// Create a user in the database to test against
					await User.query().insert({
						username: "testuser",
						email: "testuser@example.com",
						password: "Password123!",
					});

					const identifier = "nonexistentuser@example.com";
					forgotPasswordAPIRequest = await fetch(forgotPasswordUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							identifier,
						}),
					});
				});

				it("should respond with the same status as if the user exists, so that account discovery attacks are not possible", () => {
					expect(forgotPasswordAPIRequest.status).toBe(200);
				});

				it("should create a job in the queue to check that the record exists", async () => {
					const job = await forgotPasswordRequestQueue.inspect();
					expect(job).not.toBeNull();
					expect(job?.data?.identifier).toBe("nonexistentuser@example.com");
					expect(job?.data?.isEmail).toBe(true);
				});

				it("should not create a forgotPassword record in the database as no user with that username exists", async () => {
					await forgotPasswordRequestWorker.start();
					const forgotPasswordRecordCount =
						await ForgotPassword.query().resultSize();
					expect(forgotPasswordRecordCount).toBe(0);
					await forgotPasswordRequestWorker.stop();
				});
			});

			describe("when the request is attempting an SQL injection attack", () => {
				it("should respond with a fail status", async () => {
					const identifier = "'; DROP TABLE users; --";
					const forgotPasswordAPIRequest = await fetch(forgotPasswordUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							identifier,
						}),
					});
					expect(forgotPasswordAPIRequest.status).toBe(400);
				});
			});

			describe("when the request is attempting an SQL wildcard lookup", () => {
				it.todo("should respond with a fail status");
			});
		});
	});
});
