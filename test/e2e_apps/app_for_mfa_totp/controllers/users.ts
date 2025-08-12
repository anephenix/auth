// Dependencies
import { authenticator } from "otplib";
import handleError from "../helpers/handleError";
import { decryptTOTPSecret } from "../helpers/totpSecret";
import { Session } from "../models/Session"; // Adjust the import path as necessary
import { User } from "../models/User"; // Adjust the import path as necessary
import mfaService from "../services/mfaService";

const controller = {
	signup: async (request, reply) => {
		const { username, email, password, mobile_number } = request.body;

		const user = await User.query().insert({
			username,
			email,
			password, // Ensure to hash the password before saving
			mobile_number,
		});

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
	},

	setupMFATOTP: async (request, reply) => {
		const user = request.user;
		if (!user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}
		try {
			const { qrCodeImageData } = await mfaService.setupMFATOTP(user);
			return reply.status(200).send({
				qrCodeImageData,
			});
		} catch (error) {
			const errorMessage = handleError(error);
			return reply.status(500).send({ error: errorMessage });
		}
	},

	verifyMFATOTP: async (request, reply) => {
		const { token } = request.body;

		const user = request.user;
		if (!user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		const decryptedSecret = decryptTOTPSecret(user.mfa_totp_secret);

		const isValid = authenticator.check(token, decryptedSecret);
		if (!isValid) {
			return reply.status(400).send({ error: "Invalid TOTP token" });
		}

		return reply
			.status(200)
			.send({ message: "TOTP token verified successfully" });
	},

	disableMFATOTP: async (request, reply) => {
		const user = request.user;
		const { password, code } = request.body;

		if (!user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		try {
			await mfaService.disableMFATOTP({ user, password, code });
			return reply
				.status(200)
				.send({ message: "MFA TOTP disabled successfully" });
		} catch (error) {
			const errorMessage = handleError(error);
			return reply.status(400).send({ error: errorMessage });
		}
	},
};

export default controller;
