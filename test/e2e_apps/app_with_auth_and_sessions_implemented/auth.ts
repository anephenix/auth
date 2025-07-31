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
	sessionOptions: {
		accessTokenExpiresIn: 60 * 15, // 15 minutes
		refreshTokenExpiresIn: 86400 * 7, // 7 days
	},
});

export default auth;
