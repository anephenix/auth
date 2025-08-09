// Dependencies
import { authenticator } from "otplib";
import qrcode from "qrcode";
import config from "../config"; // Adjust the import path as necessary
import handleError from "../helpers/handleError";
import { decryptTOTPSecret, encryptTOTPSecret } from "../helpers/totpSecret";
import { Session } from "../models/Session"; // Adjust the import path as necessary
import { User } from "../models/User"; // Adjust the import path as necessary

// The service name for TOTP, used in the otpauth URI
const { serviceName } = config.totp;

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
		const secret = authenticator.generateSecret();

		// The authenticated user from the session
		const user = request.user;
		if (!user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		const otpauth = authenticator.keyuri(user.email, serviceName, secret);

		const encryptedSecret = encryptTOTPSecret(secret);
		await user.$query().patch({
			mfa_totp_secret: encryptedSecret, // Store the secret in the user's record
		});

		try {
			// 3. Generate a QR code to be scanned by user's 2FA app
			const qrCodeImageData = await qrcode.toDataURL(otpauth);
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

		// TODO - verify that the TOTP secret is correctly decrypted and the user can log in with MFA TOTP enabled
		/*
            NOTES - I wonder if we should use this API route solely to turn on MFA TOTP for the user
            
            And then other requests to authenticate with MFA TOTP use another API route?

            Actually, you'll have to, as this is the one that requires the user to be signed in beforehand (as in they haven't enabled MFA TOTP yet)
        */
		return reply
			.status(200)
			.send({ message: "TOTP token verified successfully" });
	},
};

export default controller;
