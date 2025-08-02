# TODO List

## Now

- [x] Convert the library to TypeScript
- [x] Figure out whether to include the build in git or to ignore it and have it as a GitHub workflow step
- [x] Setup size-limit to evaluate the build
- [x] Setup GitHub workflows in case any are missing
- [x] Setup Husky so that it will fail if a pre-commit step fails
- [x] Handle setting up a new user with a password and having the password be encrypted

## Next

- [ ] Look at supporting Magic Link (email)
- [ ] Look at supporting MFA (SMS)
- [ ] Look at supporting MFA (QR Code & app)
- [ ] Look at supporting forgot password flow
- [ ] Look at supporting reset password flow
- [ ] Look at updating username flow
- [ ] Look at updating email flow
- [ ] Look at building the web frontend flows to these flows so that you can write E2E tests with them

## Nice to haves

- [ ] Have an optional plugin to provide all of this code (models, controllers, routes) out of the box - Auth as a plugin into your app (either loading dynamically or generating the code itself)