export type AuthOptions = {
	passwordValidationRules?: {
		minLength?: number;
		maxLength?: number;
		requireUppercase?: boolean;
		requireLowercase?: boolean;
		requireNumbers?: boolean;
		requireSpecialCharacters?: boolean;
	};
};
