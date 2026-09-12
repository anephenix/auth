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
	loginOptions?: {
		maxAttempts?: number; // Maximum number of login attempts before being rate limited
		windowSeconds?: number; // The time window in seconds within which maxAttempts applies
	}; // Options for login rate limiting / brute force protection
};

export interface CheckRateLimitParams {
	attempts: number; // The number of attempts made so far within the current window
	firstAttemptAt: Date | string; // When the first attempt in the current window occurred
}

export interface RateLimitStatus {
	blocked: boolean; // Whether the caller is currently rate limited
	remainingAttempts: number; // How many attempts remain before being blocked
	retryAfter?: number; // Seconds until the window resets, only present when blocked
}

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
