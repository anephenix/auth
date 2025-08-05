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
	};
	tokenOptions?: {
		tokenExpiresIn?: number; // in seconds
		tokenGenerator?: () => string; // Function to generate a token
		codeGenerator?: () => string; // Function to generate a code
	};
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
