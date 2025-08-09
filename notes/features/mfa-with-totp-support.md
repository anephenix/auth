# Multi-Factor-Authentication with TOTP support

## Introduction

The goal is to have an application that demonstrates a working example of MFA with TOTP support, so that we can verify that users are who they say they are.

## General thoughts

However, you may want to think about how you handle the signup flow. A user is created, then they go to setup MFA with TOTP. So there's a step where they signup and have a session, then there is a step were they have mfa setup, then there is a step where they then login with MFA enabled. We need to think about what that process looks like.


## Tasks involved

- [x] Create an application in the test folder
- [x] Create the files and folders in use for it
- [x] Create a setup similar to the one used for the MFA SMS (session is created only after login and code verification)
- [x] Install the otplib dependency
- [x] Install the qrcode dependency (question - how to verify qr code from vitest - is there a decode option?)
- [x] Implement the flow to setup MFA when a user has been created
- [ ] Implement the flow to setup MFA when a user has logged in and decided to turn on MFA, including verifying that it works
- [ ] Implement the flow to turn off MFA in case say someone's phone with the app is lost/missing (question is, how should that work to prevent misuse?)
- [ ] Implement the flow to login with username/password and then MFA
- [ ] Test the flow to login as a user with/without MFA enabled, ensuring sessions are only created when allowed - (maybe as a check within the user model?)
