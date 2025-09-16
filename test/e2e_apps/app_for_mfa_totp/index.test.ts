import { join } from "node:path";
import jsQR from "jsqr";
import { authenticator } from "otplib";
import { PNG } from "pngjs";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { isIsoString } from "../../utils/comparators";
import {
	removeDatabaseFileIfExists,
	runMigrations,
} from "../app_for_password_in_separate_table/utils/manageDatabase";
import config from "./config";
import appDB from "./db"; // Assuming you have a db module to handle database connections
import app from "./index";
import { MfaToken } from "./models/MfaToken"; // Adjust the import path as necessary
import { RecoveryCode } from "./models/RecoveryCode"; // Adjust the import path as necessary
import { Session } from "./models/Session";
import { User } from "./models/User";
import mfaService from "./services/mfaService"; // Adjust the import path as necessary

const port = 3000; // Port for the Fastify server
const baseUrl = "http://localhost:3000";
const signupUrl = `${baseUrl}/signup`;
const loginUrl = `${baseUrl}/login`;
const loginWithMfaUrl = `${baseUrl}/login/mfa`; // URL for logging in with MFA
const setupMFATotpUrl = `${baseUrl}/auth/mfa/setup`;
const disableMFATotpUrl = `${baseUrl}/auth/mfa/disable`;
const recoveryCodesUrl = `${baseUrl}/auth/mfa/recovery-codes`; // URL for generating recovery codes

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
		await MfaToken.query().delete();
		await Session.query().delete();
		await User.query().delete();
	});

	afterAll(async () => {
		await app.close();
		await appDB.destroy();
	});

	describe("setting up a user to use MFA TOTP", () => {
		it("should support the flow of setting up a MFA TOTP for a user", async () => {
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

	describe("logging in as a user with MFA TOTP enabled", () => {
		it("should support the flow of logging in as a user with MFA TOTP enabled", async () => {
			const user = await User.query().insert({
				username: "mfauser",
				email: "mfauser@example.com",
				password: "ValidPassword123!",
				mobile_number: "07711 123456",
			});

			const { secret } = await mfaService.setupMFATOTP(user);
			const code = authenticator.generate(secret);

			const loginRequest = await fetch(loginUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					identifier: user.email,
					password: "ValidPassword123!",
				}),
			});

			expect(loginRequest.status).toBe(201);
			const loginResponse = await loginRequest.json();
			const { token } = loginResponse;

			const verifyMfaRequest = await fetch(loginWithMfaUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, code }),
			});

			expect(verifyMfaRequest.status).toBe(201);
			const verifyMfaResponse = await verifyMfaRequest.json();
			const {
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			} = verifyMfaResponse;

			const session = await Session.query().findOne({
				access_token,
				refresh_token,
			});
			expect(session?.access_token).toBe(access_token);
			expect(session?.refresh_token).toBe(refresh_token);
			expect(isIsoString(access_token_expires_at)).toBe(true);
			expect(isIsoString(refresh_token_expires_at)).toBe(true);

			const mfaToken = await MfaToken.query().findOne({
				user_id: user.id,
				token,
			});
			if (!mfaToken) {
				throw new Error("MFA token not found");
			}
			expect(isIsoString(mfaToken?.used_at || "")).toBe(true);
		});

		describe("logging in with MFA TOTP enabled and used code", () => {
			it("should return an error when the MFA code has already been used", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});

				const { secret } = await mfaService.setupMFATOTP(user);
				const code = authenticator.generate(secret);

				const loginRequest = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						identifier: user.email,
						password: "ValidPassword123!",
					}),
				});

				expect(loginRequest.status).toBe(201);
				const loginResponse = await loginRequest.json();
				const { token } = loginResponse;

				const verifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code }),
				});

				expect(verifyMfaRequest.status).toBe(201);

				// Make a duplicate request with the same token and code
				const duplicateVerifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code }),
				});

				expect(duplicateVerifyMfaRequest.status).toBe(400);
				const duplicateVerifyMfaResponse =
					await duplicateVerifyMfaRequest.json();
				expect(duplicateVerifyMfaResponse.error).toBe(
					"MFA token has already been used",
				);
			});
		});

		describe("logging in with MFA TOTP enabled and expired code", () => {
			it("should return an error when the MFA code has expired", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});

				const { secret } = await mfaService.setupMFATOTP(user);
				const code = authenticator.generate(secret);

				const loginRequest = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						identifier: user.email,
						password: "ValidPassword123!",
					}),
				});

				expect(loginRequest.status).toBe(201);
				const loginResponse = await loginRequest.json();
				const { token } = loginResponse;

				vi.useFakeTimers(); // Enables fake timers
				vi.advanceTimersByTime(1000 * 60); // Simulate 1 minute passing

				const verifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code }),
				});

				expect(verifyMfaRequest.status).toBe(400);
				const verifyMfaResponse = await verifyMfaRequest.json();
				expect(verifyMfaResponse.error).toBe("Invalid code");

				vi.useRealTimers();
			});
		});

		describe("logging in with MFA TOTP enabled and invalid code", () => {
			it("should return an error when the MFA code is invalid", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});

				await mfaService.setupMFATOTP(user);

				const loginRequest = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						identifier: user.email,
						password: "ValidPassword123!",
					}),
				});

				expect(loginRequest.status).toBe(201);
				const loginResponse = await loginRequest.json();
				const { token } = loginResponse;

				const verifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code: "0000001" }),
				});

				expect(verifyMfaRequest.status).toBe(400);
				const verifyMfaResponse = await verifyMfaRequest.json();
				expect(verifyMfaResponse.error).toBe("Invalid code");
			});
		});

		describe("logging in with MFA TOTP enabled and too many attempts", () => {
			it("should return an error when the number of attempts has been exceeded", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});

				await mfaService.setupMFATOTP(user);

				const loginRequest = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						identifier: user.email,
						password: "ValidPassword123!",
					}),
				});

				expect(loginRequest.status).toBe(201);
				const loginResponse = await loginRequest.json();
				const { token } = loginResponse;

				const verifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code: "0000001" }),
				});

				expect(verifyMfaRequest.status).toBe(400);
				const verifyMfaResponse = await verifyMfaRequest.json();
				expect(verifyMfaResponse.error).toBe("Invalid code");

				const secondVerifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code: "0000001" }),
				});

				expect(secondVerifyMfaRequest.status).toBe(400);
				const secondVerifyMfaResponse = await secondVerifyMfaRequest.json();
				expect(secondVerifyMfaResponse.error).toBe("Invalid code");

				const thirdVerifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code: "0000001" }),
				});

				expect(thirdVerifyMfaRequest.status).toBe(400);
				const thirdVerifyMfaResponse = await thirdVerifyMfaRequest.json();
				expect(thirdVerifyMfaResponse.error).toBe("Too many attempts");
			});
		});
	});

	describe("logging in as a user with MFA disabled", () => {
		it("should support the flow of logging in as a user with MFA disabled", async () => {
			const user = await User.query().insert({
				username: "mfauser",
				email: "mfauser@example.com",
				password: "ValidPassword123!",
				mobile_number: "07711 123456",
			});

			const loginRequest = await fetch(loginUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					identifier: user.email,
					password: "ValidPassword123!",
				}),
			});

			expect(loginRequest.status).toBe(201);
			const loginResponse = await loginRequest.json();
			const {
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			} = loginResponse;

			const session = await Session.query().findOne({
				user_id: user.id,
				access_token,
				refresh_token,
			});
			expect(session?.access_token).toBe(access_token);
			expect(session?.refresh_token).toBe(refresh_token);
			expect(isIsoString(access_token_expires_at)).toBe(true);
			expect(isIsoString(refresh_token_expires_at)).toBe(true);
		});
	});

	describe("disabling MFA TOTP for a user", () => {
		it("should support the flow of disabling MFA TOTP for a user", async () => {
			const user = await User.query().insert({
				username: "mfauser",
				email: "mfauser@example.com",
				password: "ValidPassword123!",
				mobile_number: "07711 123456",
			});

			const { secret } = await mfaService.setupMFATOTP(user);
			const code = authenticator.generate(secret);

			const loginRequest = await fetch(loginUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					identifier: user.email,
					password: "ValidPassword123!",
				}),
			});

			expect(loginRequest.status).toBe(201);
			const loginResponse = await loginRequest.json();
			const { token } = loginResponse;

			const verifyMfaRequest = await fetch(loginWithMfaUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, code }),
			});

			expect(verifyMfaRequest.status).toBe(201);
			const verifyMfaResponse = await verifyMfaRequest.json();
			const { access_token } = verifyMfaResponse;

			const disableMfaRequest = await fetch(disableMFATotpUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${access_token}`,
				},
				body: JSON.stringify({
					password: "ValidPassword123!",
					code, // The MFA TOTP code to verify before disabling
				}),
			});

			const disableMfaResponse = await disableMfaRequest.json();
			expect(disableMfaRequest.status).toBe(200);
			expect(disableMfaResponse.message).toBe("MFA TOTP disabled successfully");

			// Verify that the user's MFA TOTP secret is cleared
			const updatedUser = await User.query().findById(user.id);
			if (!updatedUser) {
				throw new Error("User not found after disabling MFA TOTP");
			}
			expect(updatedUser.mfa_totp_secret).toBeNull();
		});

		describe("when the code is invalid", () => {
			it("should return an error when the MFA code is invalid", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});

				const { secret } = await mfaService.setupMFATOTP(user);
				const code = authenticator.generate(secret);

				const loginRequest = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						identifier: user.email,
						password: "ValidPassword123!",
					}),
				});

				expect(loginRequest.status).toBe(201);
				const loginResponse = await loginRequest.json();
				const { token } = loginResponse;

				const verifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code }),
				});

				expect(verifyMfaRequest.status).toBe(201);
				const verifyMfaResponse = await verifyMfaRequest.json();
				const { access_token } = verifyMfaResponse;

				const disableMfaRequest = await fetch(disableMFATotpUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${access_token}`,
					},
					body: JSON.stringify({
						password: "ValidPassword123!",
						code: "000001", // The MFA TOTP code to verify before disabling
					}),
				});

				expect(disableMfaRequest.status).toBe(400);
				const disableMfaResponse = await disableMfaRequest.json();
				expect(disableMfaResponse.error).toBe("Invalid MFA TOTP code");
			});
			it("should return an error when the password is incorrect", async () => {
				const user = await User.query().insert({
					username: "mfauser",
					email: "mfauser@example.com",
					password: "ValidPassword123!",
					mobile_number: "07711 123456",
				});

				const { secret } = await mfaService.setupMFATOTP(user);
				const code = authenticator.generate(secret);

				const loginRequest = await fetch(loginUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						identifier: user.email,
						password: "ValidPassword123!",
					}),
				});

				expect(loginRequest.status).toBe(201);
				const loginResponse = await loginRequest.json();
				const { token } = loginResponse;

				const verifyMfaRequest = await fetch(loginWithMfaUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token, code }),
				});

				expect(verifyMfaRequest.status).toBe(201);
				const verifyMfaResponse = await verifyMfaRequest.json();
				const { access_token } = verifyMfaResponse;

				const disableMfaRequest = await fetch(disableMFATotpUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${access_token}`,
					},
					body: JSON.stringify({
						password: "wrongPassword123!",
						code,
					}),
				});

				expect(disableMfaRequest.status).toBe(400);
				const disableMfaResponse = await disableMfaRequest.json();
				expect(disableMfaResponse.error).toBe("Password incorrect");
			});
		});

		it.todo(
			"should also support the option of disabling MFA TOTP if say the user lost the device they used for MFA TOTP with a recovery code",
		);
	});

	describe("generating recovery codes", () => {
		it("should support generating recovery codes for a user", async () => {
			const user = await User.query().insert({
				username: "mfauser",
				email: "mfauser@example.com",
				password: "ValidPassword123!",
				mobile_number: "07711 123456",
			});

			const { secret } = await mfaService.setupMFATOTP(user);
			const code = authenticator.generate(secret);

			const loginRequest = await fetch(loginUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					identifier: user.email,
					password: "ValidPassword123!",
				}),
			});

			expect(loginRequest.status).toBe(201);
			const loginResponse = await loginRequest.json();
			const { token } = loginResponse;

			const verifyMfaRequest = await fetch(loginWithMfaUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, code }),
			});

			expect(verifyMfaRequest.status).toBe(201);
			const verifyMfaResponse = await verifyMfaRequest.json();
			const { access_token } = verifyMfaResponse;

			// Make a request to generate recovery codes
			const recoveryCodesRequest = await fetch(recoveryCodesUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${access_token}`,
				},
				body: JSON.stringify({}),
			});

			const recoveryCodesResponse = await recoveryCodesRequest.json();
			expect(recoveryCodesRequest.status).toBe(201);
			expect(recoveryCodesResponse.codes).toBeDefined();
			expect(recoveryCodesResponse.codes).toHaveLength(10);
		});
	});

	describe("using a recovery code to login when MFA device is lost/stolen", () => {
		it("should allow login using a recovery code", async () => {
			const user = await User.query().insert({
				username: "mfauser",
				email: "mfauser@example.com",
				password: "ValidPassword123!",
				mobile_number: "07711 123456",
			});

			await mfaService.setupMFATOTP(user);

			const loginRequest = await fetch(loginUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					identifier: user.email,
					password: "ValidPassword123!",
				}),
			});

			expect(loginRequest.status).toBe(201);
			const loginResponse = await loginRequest.json();
			const { token } = loginResponse;

			const codes = await RecoveryCode.generateCodes();
			const recovery_code = codes[0];
			// Create a recovery code that we will use
			await RecoveryCode.query().insert({
				user_id: user.id,
				code: recovery_code,
			});

			const verifyMfaRequest = await fetch(loginWithMfaUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, recovery_code }),
			});

			expect(verifyMfaRequest.status).toBe(201);
			const verifyMfaResponse = await verifyMfaRequest.json();

			const {
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			} = verifyMfaResponse;

			const session = await Session.query().findOne({
				user_id: user.id,
				access_token,
				refresh_token,
			});
			expect(session?.access_token).toBe(access_token);
			expect(session?.refresh_token).toBe(refresh_token);
			expect(isIsoString(access_token_expires_at)).toBe(true);
			expect(isIsoString(refresh_token_expires_at)).toBe(true);
		});
	});
});
