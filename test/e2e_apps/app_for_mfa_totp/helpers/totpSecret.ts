import crypto from "node:crypto";
import config from "../config";

// We get this from the environment variables, it should be set in the .env file
const { totpSecretEncryptionKey } = config.totp;

if (!totpSecretEncryptionKey || totpSecretEncryptionKey.length !== 64) {
	throw new Error(
		"TOTP_SECRET_ENCRYPTION_KEY must be set and be 64 characters long (32 bytes in hex)",
	);
}

const ENCRYPTION_KEY = Buffer.from(totpSecretEncryptionKey, "hex"); // 32 bytes
const IV_LENGTH = 12; // Recommended for GCM

export function encryptTOTPSecret(secret: string): string {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

	const encrypted = Buffer.concat([
		cipher.update(secret, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	// Return as base64: iv + encrypted + authTag
	return Buffer.concat([iv, encrypted, authTag]).toString("base64");
}

export function decryptTOTPSecret(encryptedBase64: string): string {
	const data = Buffer.from(encryptedBase64, "base64");
	const iv = data.subarray(0, IV_LENGTH);
	const authTag = data.subarray(data.length - 16); // GCM tag is 16 bytes
	const encrypted = data.subarray(IV_LENGTH, data.length - 16);

	const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);

	return decrypted.toString("utf8");
}
