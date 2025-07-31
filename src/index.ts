/*

	This is a class that is exported from the "@anephenix/auth" package.

	It is used to handle authentication-related tasks, such as:

	- validating passwords.
	- creating a password for an existing entity (e.g., a user).
	- encrypting passwords before they are stored in the database.

	It is designed to be flexible and extensible, allowing developers to customize the authentication process as needed.
*/
import { randomBytes } from "node:crypto";
import * as argon2 from "argon2";
import type { AuthOptions, GenerateSessionProps, SessionObject } from "./types";

const DEFAULTS = {
	accessTokenExpiresIn: 3600, // Default to 1 hour
	refreshTokenExpiresIn: 86400, // Default to 1 day
};

export class Auth {
	private options: AuthOptions;

	constructor(options: AuthOptions) {
		this.options = options;
		/*
			If there are password validation rules specified in the options,
			validate them to ensure they are compatible.
		*/
		if (this.options.passwordValidationRules) {
			this.validatePasswordRules(this.options.passwordValidationRules);
		}
		this.validateSessionOptions();

		if (!this.options.sessionOptions) {
			this.options.sessionOptions = {
				accessTokenExpiresIn: 3600, // Default to 1 hour
				refreshTokenExpiresIn: 86400, // Default to 1 day
			};
		} else {
			// Ensure session options have default values if not provided
			this.options.sessionOptions.accessTokenExpiresIn ??= 3600; // Default to 1 hour
			this.options.sessionOptions.refreshTokenExpiresIn ??= 86400; // Default to 1 day
		}
	}

	/*
		This function validates the session options to ensure that they are set correctly.
		If the session options are not set, it will set them to default values.
	*/
	validateSessionOptions(): void {
		if (!this.options.sessionOptions) this.options.sessionOptions = {};
		const { sessionOptions } = this.options;
		sessionOptions.accessTokenExpiresIn ??= DEFAULTS.accessTokenExpiresIn;
		sessionOptions.refreshTokenExpiresIn ??= DEFAULTS.refreshTokenExpiresIn;
	}

	/*
		This method checks that the password validation rules are compatible, 
		and will throw an error if they are not (e.g. the minLength is greater 
		than the maxLength).
	*/
	validatePasswordRules(rules: AuthOptions["passwordValidationRules"]): void {
		const { minLength, maxLength } = rules || {};
		if (minLength && maxLength && minLength > maxLength) {
			throw new Error(
				"Password validation rules are incompatible: minLength is greater than maxLength.",
			);
		}
	}

	/*
		Validates the password according to the password rules.
		If valid it returns true, otherwise it returns false.
	*/
	validatePassword(password: string): boolean {
		if (this.options.passwordValidationRules) {
			const {
				minLength,
				maxLength,
				requireUppercase,
				requireLowercase,
				requireNumbers,
				requireSpecialCharacters,
			} = this.options.passwordValidationRules;

			if (minLength && password.length < minLength) {
				return false;
			}
			if (maxLength && password.length > maxLength) {
				return false;
			}
			if (requireUppercase && !/[A-Z]/.test(password)) {
				return false;
			}
			if (requireLowercase && !/[a-z]/.test(password)) {
				return false;
			}
			if (requireNumbers && !/[0-9]/.test(password)) {
				return false;
			}
			if (
				requireSpecialCharacters &&
				!/[!@#$%^&*(),.?":{}|<>]/.test(password)
			) {
				return false;
			}
		}
		return true;
	}

	/*
		This function hashes a plaintext password and returns the password
		in a hashed format that can be stored in the database.
	*/
	async hashPassword(password: string): Promise<string> {
		return await argon2.hash(password);
	}

	/*
		This function verifies a plaintext password against a hashed password.
		It returns true if the password matches, otherwise it returns false.
	*/
	async verifyPassword(
		password: string,
		hashedPassword: string,
	): Promise<boolean> {
		return await argon2.verify(hashedPassword, password);
	}

	/*
		Generates a session object containing access and refresh tokens,
		and their respective expiration times.
	*/
	generateSession(generateSessionProps?: GenerateSessionProps): SessionObject {
		const { sessionOptions } = this.options;
		const accessTokenExpiresIn =
			generateSessionProps?.accessTokenExpiresIn ??
			sessionOptions?.accessTokenExpiresIn ??
			DEFAULTS.accessTokenExpiresIn;
		const refreshTokenExpiresIn =
			generateSessionProps?.refreshTokenExpiresIn ??
			sessionOptions?.refreshTokenExpiresIn ??
			DEFAULTS.refreshTokenExpiresIn;

		// Question - should the token generation be configurable? - Maybe.
		const accessToken = randomBytes(32).toString("hex");
		const refreshToken = randomBytes(32).toString("hex");
		const accessTokenExpiresAt = new Date(
			Date.now() + accessTokenExpiresIn * 1000,
		);
		const refreshTokenExpiresAt = new Date(
			Date.now() + refreshTokenExpiresIn * 1000,
		);
		return {
			accessToken,
			refreshToken,
			accessTokenExpiresAt,
			refreshTokenExpiresAt,
		};
	}
}
