import { Auth } from "../../../src/index";

const auth = new Auth({
	passwordValidationRules: {
		minLength: 8,
		maxLength: 20,
		requireUppercase: true,
		requireLowercase: true,
		requireNumbers: true,
		requireSpecialCharacters: true,
	},
	loginOptions: {
		maxAttempts: 3,
		windowSeconds: 60, // 1 minute
	},
});

export default auth;
