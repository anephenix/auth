import { authenticator } from "otplib";
import qrcode from "qrcode";
import config from "../config"; // Adjust the import path as necessary
import { encryptTOTPSecret } from "../helpers/totpSecret";

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
};

export default service;
