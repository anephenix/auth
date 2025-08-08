# TODO List

- [x] Convert the library to TypeScript
- [x] Figure out whether to include the build in git or to ignore it and have it as a GitHub workflow step
- [x] Setup size-limit to evaluate the build
- [x] Setup GitHub workflows in case any are missing
- [x] Setup Husky so that it will fail if a pre-commit step fails
- [x] Handle setting up a new user with a password and having the password be encrypted
- [x] Look at supporting Magic Link (email)
- [x] Add options to configure the token and code used for magic link (length, characters, etc) 
- [x] Do a review and cleanup any TODO/NOTE/QUESTION items, plus refine any `.toBeDefined` calls in the unit tests
- [x] Look at supporting MFA (SMS)
- [x] Implement a rule that usernames be lowercased so that attackers can't just pass uppercase characters to bypass lock out rules
- [x] Implement a rule that all submitted identifiers are lowercased and trimmed of spaces - so no chance to trick account creation/lookup

## Now

- [ ] Look at supporting MFA (QR Code & app)

## Next

- [ ] Implement a way to ensure that username lookup timing attacks can't happen (establish that a username is valid within a system)
- [ ] Implement the same principle for passwords
- [ ] Look at supporting forgot password flow
- [ ] Look at supporting reset password flow
- [ ] Look at updating username flow
- [ ] Look at updating email flow
- [ ] Look at building the web frontend flows to these flows so that you can write E2E tests with them

## Nice to haves

- [ ] Have an optional plugin to provide all of this code (models, controllers, routes) out of the box - Auth as a plugin into your app (either loading dynamically or generating the code itself)
