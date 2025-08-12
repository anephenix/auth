import { authenticator } from "otplib";
import qrcode from "qrcode";
import config from "../config"; // Adjust the import path as necessary
import { decryptTOTPSecret, encryptTOTPSecret } from "../helpers/totpSecret";
import { User } from "../models/User"; // Adjust the import path as necessary

// The service name for TOTP, used in the otpauth URI
const { serviceName } = config.totp;

const service = {
	setupMFATOTP: async (user) => {
		if (!user) {
			throw new Error("User is required to setup MFA TOTP");
		}

		// Can we extract this out into a service of some kind?
		const secret = authenticator.generateSecret();
		const otpauth = authenticator.keyuri(user.email, serviceName, secret);

		const encryptedSecret = encryptTOTPSecret(secret);
		await user.$query().patch({
			mfa_totp_secret: encryptedSecret, // Store the secret in the user's record
		});

		const qrCodeImageData = await qrcode.toDataURL(otpauth);

		return {
			qrCodeImageData,
			secret,
		};
	},

	disableMFATOTP: async ({ user, password, code }) => {
		if (!user) {
			throw new Error("User is required to disable MFA TOTP");
		}

		if (!password || !code) {
			throw new Error("Password and code are required to disable MFA TOTP");
		}

		// Verify the user's password (this should be done securely)
		const isPasswordValid = await User.authenticate({
			identifier: user.username,
			password,
		});
		if (!isPasswordValid) {
			throw new Error("Invalid password");
		}

		const isValid = authenticator.check(
			code,
			decryptTOTPSecret(user.mfa_totp_secret),
		);
		if (!isValid) {
			throw new Error("Invalid MFA TOTP code");
		}

		// Clear the secret to disable MFA TOTP
		await user.$query().patch({
			mfa_totp_secret: null,
		});

		// TODO - you'll also have to delete the user's recovery codes if they exist

		return { message: "MFA TOTP disabled successfully" };
	},
};

export default service;
