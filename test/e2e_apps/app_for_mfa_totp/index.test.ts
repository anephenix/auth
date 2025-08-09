import { join } from "node:path";
import jsQR from "jsqr";
import { authenticator } from "otplib";
import { PNG } from "pngjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	removeDatabaseFileIfExists,
	runMigrations,
} from "../app_for_password_in_separate_table/utils/manageDatabase";
import config from "./config";
import appDB from "./db"; // Assuming you have a db module to handle database connections
import app from "./index";
import { Session } from "./models/Session";
import { User } from "./models/User";

const port = 3000; // Port for the Fastify server
const baseUrl = "http://localhost:3000";
const signupUrl = `${baseUrl}/signup`;
const setupMFATotpUrl = `${baseUrl}/auth/mfa/setup`;

describe("E2E Tests for MFA TOTP", () => {
	beforeAll(async () => {
		const dbPath = join(
			import.meta.dirname,
			"..",
			"..",
			"..",
			"test",
			"e2e_apps",
			"app_with_mfa_totp",
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

	describe("setting up a new user to use MFA TOTP", () => {
		it("should support the flow of setting up a MFA TOTP for a new user", async () => {
			const newUserPayload = {
				username: "testuser",
				email: "testuser@example.com",
				password: "ValidPassword123!",
				mobile_number: "07711 123456", // Doesn't have to be a real mobile phone - we're not sending the sms code out to a phone number, just putting it in a message queue.
			};

			const signupRequest = await fetch(signupUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newUserPayload),
			});

			const signupResponse = await signupRequest.json();
			expect(signupRequest.status).toBe(201); // Assuming 201 Created is the expected response for successful signup
			const { access_token } = signupResponse;

			const mfaSetupRequest = await fetch(setupMFATotpUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${access_token}`,
				},
				body: JSON.stringify({}), // Include any necessary payload for MFA setup
			});

			// Assuming 200 OK is the expected response for successful MFA setup
			expect(mfaSetupRequest.status).toBe(200);
			const mfaSetupResponse = await mfaSetupRequest.json();
			const { qrCodeImageData } = mfaSetupResponse;
			const base64 = qrCodeImageData.replace(/^data:image\/png;base64,/, "");
			const buffer = Buffer.from(base64, "base64");

			// Parse PNG → RGBA bytes
			const png = PNG.sync.read(buffer);
			const data = new Uint8ClampedArray(png.data); // RGBA byte array

			// jsQR wants Uint8ClampedArray
			const code = jsQR(data, png.width, png.height);

			if (!code) {
				throw new Error("Failed to decode QR code");
			}

			expect(code).toBeTruthy();
			const uri = code.data;

			expect(uri.startsWith("otpauth://")).toBe(true);

			// Extract the secret from the URI
			const parsedUrl = new URL(uri);
			const secret = parsedUrl.searchParams.get("secret");

			if (!secret) {
				throw new Error("Failed to extract secret from URI");
			}
			expect(secret).toBeTruthy();

			// Generate the OTP code
			const token = authenticator.generate(secret);
			const isValid = authenticator.check(token, secret);

			expect(isValid).toBe(true);
		});
	});

	describe("an existing user deciding to enable MFA TOTP", () => {
		it.todo(
			"should support the flow of setting up a MFA TOTP for an existing user",
		);
	});

	describe("logging in as a user with MFA TOTP enabled", () => {
		it.todo(
			"should support the flow of logging in as a user with MFA TOTP enabled",
		);
		/*
            - We need to create a new user
            - We then need to POST signup (username, email password)
            - We then need to make an API request to setup MFA - I'll need to check the flow here
            - We then need to login with the user and get the access token
            - We then need to make an API request to get the QR code data URL
            - We then need to use a library to read the QR code data URL and get the secret
            - We then need to use the secret to generate a TOTP code
            - We then need to use the TOTP code to login and get a session back (access token, refresh token)
        */
	});

	describe("logging in as a user with MFA disabled", () => {
		it.todo(
			"should support the flow of logging in as a user with MFA disabled",
		);
	});

	describe("disabling MFA TOTP for a user", () => {
		it.todo("should support the flow of disabling MFA TOTP for a user");
		it.todo(
			"should also support the option of disabling MFA TOTP if say the user lost the device they used for MFA TOTP with a recovery code",
		);

		/*
            - We need to create a new user
            - We then need to POST signup (username, email password)
            - We then need to make an API request to setup MFA - I'll need to check the flow here
            - We then need to login with the user and get the access token
            - We then need to make an API request to disable MFA TOTP
            - We should then be able to login without MFA TOTP
        */
	});
});
