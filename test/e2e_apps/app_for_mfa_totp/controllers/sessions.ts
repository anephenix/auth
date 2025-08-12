import { authenticator } from "otplib";
import auth from "../auth"; // Adjust the import path as necessary
import handleError from "../helpers/handleError"; // Adjust the import path as necessary
import { decryptTOTPSecret } from "../helpers/totpSecret";
import { MfaToken } from "../models/MfaToken"; // Adjust the import path as necessary
import { RecoveryCode } from "../models/RecoveryCode"; // Adjust the import path as necessary
import { Session } from "../models/Session"; // Adjust the import path as necessary
import { User } from "../models/User"; // Adjust the import path as necessary

const controller = {
	create: async (request, reply) => {
		try {
			const { identifier, password } = request.body as {
				identifier: string;
				password: string;
			};

			if (!identifier)
				throw new Error("Please provide your username or email address");
			if (!password) throw new Error("Password is required");

			const user = await User.authenticate({ identifier, password });
			if (!user) {
				return reply.status(401).send({ error: "Invalid credentials" });
			}

			if (user.isUsingMFA) {
				// Generate a random code and set the expiration time
				const { token, expiresAt } = await auth.generateMfaLoginToken();

				await MfaToken.query().insert({
					user_id: user.id,
					token,
					expires_at: expiresAt.toISOString(),
					number_of_attempts: 0, // Initialize attempts to 0
				});

				return reply.status(201).send({
					token,
				});
			} else {
				const session = await Session.query().insert({
					user_id: user.id,
					...Session.generateTokens(), // Generates access and refresh tokens
				});

				const {
					access_token,
					refresh_token,
					access_token_expires_at,
					refresh_token_expires_at,
				} = session;

				return reply.status(201).send({
					access_token,
					refresh_token,
					access_token_expires_at,
					refresh_token_expires_at,
				});
			}
		} catch (error) {
			const errorMessage = handleError(error);
			reply.status(401).send({ error: errorMessage });
		}
	},

	mfaLogin: async (request, reply) => {
		const { token, code, recovery_code } = request.body as {
			token: string;
			code: string;
			recovery_code?: string;
		};

		// We check if the request has a code or recovery code
		const hasCodeOrRecoveryCode = !!code || !!recovery_code;
		const hasToken = !!token;

		if (!hasToken || !hasCodeOrRecoveryCode) {
			return reply
				.status(400)
				.send({ error: "Token and code/recovery_code are required" });
		}

		try {
			const mfaToken = await MfaToken.query().where({ token }).first();
			if (!mfaToken) {
				return reply.status(400).send({ error: "MFA token not found" });
			}

			if (mfaToken.number_of_attempts >= auth.maxMfaAttempts) {
				return reply.status(400).send({ error: "Too many attempts" });
			}

			if (mfaToken.used_at) {
				return reply
					.status(400)
					.send({ error: "MFA token has already been used" });
			}

			const user = await User.query().findById(mfaToken.user_id);
			if (!user) {
				return reply.status(400).send({ error: "User not found" });
			}

			if (!user.mfa_totp_secret) {
				return reply
					.status(400)
					.send({ error: "User does not have MFA enabled" });
			}

			// If the user is using a recovery code to perform MFA
			if (recovery_code) {
				const recoveryCodes = await RecoveryCode.query().where({
					user_id: user.id,
					used_at: null,
				});
				if (recoveryCodes.length === 0) {
					return reply
						.status(400)
						.send({ error: "No recovery codes available" });
				} else {
					let isValidRecoveryCode = false;
					for (const recoveryCodeRecord of recoveryCodes) {
						if (await recoveryCodeRecord.verify(recovery_code)) {
							isValidRecoveryCode = true;
							break;
						}
					}
					if (!isValidRecoveryCode) {
						return reply.status(400).send({ error: "Invalid recovery code" });
					}
				}
			} else {
				const secret = decryptTOTPSecret(user.mfa_totp_secret);

				const isValid = authenticator.check(code, secret);
				if (!isValid) {
					// Increment the number of attempts
					await mfaToken.$query().increment("number_of_attempts", 1);
					return reply.status(400).send({ error: "Invalid code" });
				}
			}

			const session = await Session.query().insert({
				user_id: mfaToken.user_id,
				...Session.generateTokens(),
			});
			await mfaToken.$query().patch({ used_at: new Date().toISOString() });

			const {
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			} = session;

			return reply.status(201).send({
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			});
		} catch (error) {
			const errorMessage = handleError(error);
			reply.status(401).send({ error: errorMessage });
		}
	},
};

export default controller;
