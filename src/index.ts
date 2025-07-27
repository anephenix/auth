/*

	This is a class that is exported from the "@anephenix/auth" package.

	It is used to handle authentication-related tasks, such as:

	- validating passwords.
	- creating a password for an existing entity (e.g., a user).
	- encrypting passwords before they are stored in the database.

	It is designed to be flexible and extensible, allowing developers to customize the authentication process as needed.
*/
import type { AuthOptions } from "./types";

export class Auth {
	private options: AuthOptions;

	constructor(options: AuthOptions) {
		this.options = options;
		if (this.options.passwordValidationRules) {
			this.validatePasswordRules(this.options.passwordValidationRules);
		}
	}

	validatePasswordRules(rules: AuthOptions["passwordValidationRules"]): void {
		const { minLength, maxLength } = rules || {};
		if (minLength && maxLength && minLength > maxLength) {
			throw new Error(
				"Password validation rules are incompatible: minLength is greater than maxLength.",
			);
		}
	}

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
}
