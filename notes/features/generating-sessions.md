# Generating Sessions

A session is a combination of the following:

- An access token
- A refresh token
- An expiry time for the access token

This is used by the client where the user authenticated themselves to validate their API request.

So, we need to do the following:

- [x] Have a way to generate a session with those values
- Have a way to associate the session with the user (so we know who the session is for)
- [x] Store those values somewhere along with relevant metadata
- [x] Have a way to look up and retrieve that data
- [x] Have a way to expire a given session
- [x] Have a way to generate a new session using the refresh token

## Have a way to generate a session with those values

How would I do this as a user of the auth module?

I would probably create an instance of the auth module like this:

```typescript
import { Auth } from "@anephenix/auth";

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

// Generate a new session, values only, no storage mechanism implemented
const session = auth.generateSession();

/* The session would look like this:
    {
        accessToken: '',
        refreshToken: '',
        accessTokenExpiresAt: '', // Have a default token expiry time, but configurable
        refreshTokenExpiresAt: '' // Have a default token expiry time, but configurable
    }
```

You would then take those values, and store them somewhere, most likely in 
Redis, alongside other relevant metadata (user_id, request_ip_address, request_user_agent).

