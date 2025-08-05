// Dependencies
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	removeDatabaseFileIfExists,
	runMigrations,
} from "../app_for_password_in_separate_table/utils/manageDatabase";
import auth from "./auth";
import config from "./config";
import appDB from "./db";
import app from "./index";
import { MagicLink } from "./models/MagicLink";
import { User } from "./models/User";
import emailQueue from "./queues/EmailQueue";
import type { SendMagicLinkEmailJob } from "./types";

// Configuration
const port = 3000; // Port for the Fastify server
const baseUrl = `http://localhost:${port}`;
const magicLinksUrl = `${baseUrl}/magic-links`;

describe("Magic Links", () => {
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

	describe("Creating a magic link for a user", () => {
		describe("when the user email is valid", () => {
			it("should create  a magic link for the user", async () => {
				const user = await User.query().insert({
					username: "testuser",
					email: "testuser@example.com",
				});

				const payload = { email: user.email };

				const response = await fetch(magicLinksUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				});

				expect(response.status).toBe(201);
				const data = await response.json();
				expect(data.message).toBe("Magic link created");
				const magicLinks = await MagicLink.query().where({ user_id: user.id });
				expect(magicLinks).toBeDefined();
				expect(magicLinks.length).toBe(1);
				expect(magicLinks[0].user_id).toBe(user.id);

				const emailJob =
					(await emailQueue.inspect()) as SendMagicLinkEmailJob | null;
				if (!emailJob) {
					throw new Error("No email job found in the queue");
				}
				expect(emailJob.data.to).toBe(user.email);
				expect(emailJob.data.token).toBe(magicLinks[0].token);
				expect(emailJob.data.code).toBeDefined();
				// TODO - At some point, have a function in MagicLink to authenticate a token and code
				const isValidCode = await auth.verifyPassword(
					emailJob.data.code,
					magicLinks[0].hashed_code,
				);
				expect(isValidCode).toBe(true);
			});
		});

		describe("when the email is not present", () => {
			it("should return an error response", async () => {
				const payload = {};

				const response = await fetch(magicLinksUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				});
				expect(response.status).toBe(400);
				const data = await response.json();
				expect(data.error).toBe("No email provided - please provide an email");
			});
		});

		describe("when the email is not a valid email address", () => {
			it("should return an error response", async () => {
				const payload = { email: "invalid-email" };

				const response = await fetch(magicLinksUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				});
				expect(response.status).toBe(400);
				const data = await response.json();
				expect(data.error).toBe("Invalid email address");
			});
		});

		describe("when there is no user with that email address", () => {
			it("should return an error response", async () => {
				const payload = { email: "nonexistent@example.com" };

				const response = await fetch(magicLinksUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				});
				expect(response.status).toBe(400);
				const data = await response.json();
				expect(data.error).toBe("User not found for email");
			});
		});
	});

	describe("Using a magic link for a user", () => {
		describe("when the magic link is valid and not yet used", () => {
			it.todo("should authenticate the user and create a session");
			it.todo("should mark the magic link as used");
		});
	});
});
