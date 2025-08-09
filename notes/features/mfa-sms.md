# Multi-Factor-Authentication (SMS)

These are some notes on implementing MFA with SMS

## Requirements

- Generate a short code (usually 6 characters or numbers)
- The code will expire in a short time window (say 5 minutes)
- Once the code is used, it is expired
- This is similar to magic link, but the difference is that there is no token, and no link to click through to

## Task list

- [x] You need to create an app for the mfa-sms option 
- [x] You then need to create an SMS Code model that will store a hashed copy of the code (identical to the MagicLink model but no token and a shorter code is used)
- [x] You then need to create an option to Login with Username and Password (can have password in User model for convenience)
- [x] After Login authentication is successful, rather than create a session, you create an SMS Code, and then put in on a queue for sending to the user via SMS
- [x] Once that is done, you then need an API endpoint for verifying the code
- [x] If the code is valid, authenticate the user, create a session for them and return that in the API response.
- [x] If the code is not valid, or has been used, or has expired, then return an error.

## Thoughts

Should we look to implement an option for number of retries on a code/rate-limiting? So as to prevent brute-force attempts?

I think so, but I think that because there are multiple things that might be re-attempted (password, magic link), this is probably something that requires more thought and an appropriate tool to handle it (thinking Redis with TTL to handle time-windows)