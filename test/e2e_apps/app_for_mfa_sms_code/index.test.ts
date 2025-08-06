import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { isSmsCode } from "../../utils/comparators";
import {
	removeDatabaseFileIfExists,
	runMigrations,
} from "../app_for_password_in_separate_table/utils/manageDatabase";
import config from "./config";
import appDB from "./db";
import app from "./index";
import { SmsCode } from "./models/SmsCode";
import { User } from "./models/User";
import SmsCodeQueue from "./queues/SmsCodeQueue";
import type { SmsCodeQueueJob } from "./types";

const port = 3000; // Port for the Fastify server
const baseUrl = `http://localhost:${port}`;
const sessionsUrl = `${baseUrl}/sessions`;

describe("app for mfa sms code", () => {
	// I think this hook might need to happen somewhere else before all other tests run
	beforeAll(async () => {
		const dbPath = join(
			import.meta.dirname,
			"..",
			"..",
			"..",
			"test",
			"e2e_apps",
			"app_for_magic_links",
			"database.sqlite",
		);

		// Delete the database.sqlite file (if it exists)
		await removeDatabaseFileIfExists(dbPath);
		// Run the knex migrations to create the database schema
		await runMigrations(config.db);
		await app.listen({ port });
	});

	afterAll(async () => {
		await app.close();
		await appDB.destroy();
	});

	beforeEach(async () => {
		await SmsCodeQueue.flushAll();
		await SmsCode.query().delete();
		await User.query().delete();
	});

	describe("POST /sessions", () => {
		describe("when the username and password are correct", () => {
			it("should return a 201 response with a success message, create a sms code record in the database, and put an sms code message on the sms code queue", async () => {
				const user = await User.query().insert({
					username: "testuser",
					email: "testuser@example.com",
					password: "ValidPassword!123",
					mobile_number: "07711 123456", // Doesn't have to be a real mobile phone - we're not sending the sms code out to a phone number, just putting it in a message queue.
				});

				const payload = {
					identifier: "testuser",
					password: "ValidPassword!123",
				};

				const response = await fetch(sessionsUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				});

				expect(response.status).toBe(201);
				const responseBody = await response.json();
				expect(responseBody).toEqual({
					message:
						"Authentication successful. SMS code sent to verify authentication",
				});

				const smsCode = await SmsCode.query().findOne({ user_id: user.id });
				expect(smsCode?.user_id).toBe(user.id);

				const smsCodeJob = (await SmsCodeQueue.inspect()) as SmsCodeQueueJob;
				expect(smsCodeJob?.data?.mobile_number).toBe(user.mobile_number);
				expect(isSmsCode(smsCodeJob?.data?.code)).toBe(true);
			});
		});

		describe("when the username is correct but the password is invalid", () => {
			it.todo("should return a 400 reponse with the error message");
			it.todo("should not create an SmsCode record in the database");
		});

		describe("when the username is not found", () => {
			it.todo("should return a 400 reponse with the error message");
			it.todo("should not create an SmsCode record in the database");
		});
	});

	describe("POST /sessions/verify-code", () => {
		describe("when the code is valid", () => {
			it.todo(
				"should return a 201 response with the access/refresh tokens and their expiry dates",
			);
			it.todo("should create a Session record in the database");
			it.todo(
				"should mark the SmsCode as used so that it cannot be used again",
			);
		});

		describe("when the code is incorrect", () => {
			it.todo("should return a 400 response with the error message");
			it.todo("should not create a Session record in the database");
		});

		describe("when the code is expired", () => {
			it.todo("should return a 400 response with the error message");
			it.todo("should not create a Session record in the database");
		});

		describe("when the code is already used", () => {
			it.todo("should return a 400 response with the error message");
			it.todo("should not create a Session record in the database");
		});
	});
});
