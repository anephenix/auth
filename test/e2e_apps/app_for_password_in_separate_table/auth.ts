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
});

export default auth;
