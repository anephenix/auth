export type AuthOptions = {
	passwordValidationRules?: {
		minLength?: number;
		maxLength?: number;
		requireUppercase?: boolean;
		requireLowercase?: boolean;
		requireNumbers?: boolean;
		requireSpecialCharacters?: boolean;
	};
	sessionOptions?: {
		accessTokenExpiresIn?: number; // in seconds
		refreshTokenExpiresIn?: number; // in seconds
		accessTokenGenerator?: () => string; // Function to generate an access token
		refreshTokenGenerator?: () => string; // Function to generate a refresh token
	};
	tokenOptions?: {
		tokenExpiresIn?: number; // in seconds
		tokenGenerator?: () => string; // Function to generate a token
		codeGenerator?: () => string; // Function to generate a code
	};
	smsCodeOptions?: {
		smsCodeExpiresIn?: number; // in seconds
		smsCodeGenerator?: () => string; // Function to generate a code for SMS
	};
	mfaTokenOptions?: {
		mfaTokenExpiresIn?: number; // in seconds
		tokenGenerator?: () => string; // Function to generate a token
		maxAttempts?: number; // Maximum number of attempts for MFA
	}; // Options for MFA tokens
};

export interface GenerateSessionProps {
	accessTokenExpiresIn?: number; // in seconds
	refreshTokenExpiresIn?: number; // in seconds
}

export type SessionObject = {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresAt: Date;
	refreshTokenExpiresAt: Date;
};
