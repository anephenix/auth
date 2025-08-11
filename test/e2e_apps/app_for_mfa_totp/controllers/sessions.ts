import { authenticator } from "otplib";
import auth from "../auth"; // Adjust the import path as necessary
import handleError from "../helpers/handleError"; // Adjust the import path as necessary
import { decryptTOTPSecret } from "../helpers/totpSecret";
import { MfaToken } from "../models/MfaToken"; // Adjust the import path as necessary
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
		const { token, code } = request.body as {
			token: string;
			code: string;
		};

		if (!token || !code) {
			return reply.status(400).send({ error: "Token and code are required" });
		}

		try {
			const mfaToken = await MfaToken.query().where({ token }).first();
			if (!mfaToken) {
				return reply.status(400).send({ error: "MFA token not found" });
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

			const secret = decryptTOTPSecret(user.mfa_totp_secret);

			const isValid = authenticator.check(code, secret);
			if (!isValid) {
				// Increment the number of attempts
				await mfaToken.$query().increment("number_of_attempts", 1);
				return reply.status(400).send({ error: "Invalid code" });
			}

			// TODO - handle the case where the number of attempts has been exceeded
			// TODO - handle the case where the code is invalid

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
