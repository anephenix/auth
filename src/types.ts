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
