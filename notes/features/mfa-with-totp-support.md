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
- [x] Implement the flow to setup MFA when a user has logged in and decided to turn on MFA, including verifying that it works
- [x] Implement the flow to login with username/password and then MFA
- [ ] Implement the flow to turn off MFA in case say someone's phone with the app is lost/missing (question is, how should that work to prevent misuse?)
- [ ] Test the flow to login as a user with/without MFA enabled, ensuring sessions are only created when allowed - (maybe as a check within the user model?)

### Implement the flow to turn off MFA in case say someone's phone with the app is lost/missing (question is, how should that work to prevent misuse?)

- If the user doesn't have the 2FA app, then they need to provide a recovery code.
- We will need a way to generate the recovery code for them (which we haven't implemented yet)
- We also need to handle the case of them not having a recovery code - at this stage we could 
  offer them the chance to verify via email.
- Question - what if someone has stolen their phone and has access to SMS/Email?
- Then we probably need to setup a way to lock the account if say they have been compromised?
- Question is, could someone abuse this functionality to lock out accounts they have no access to? - Possibly - not sure how to prevent them from locking an account


- So, I think we need to implement recovery codes for a user
- I imagine that they:

- Should be stored in a table somewhere, in encrypted form, and associated with a user
- The user should receive the recovery codes in a text format.
- The recovery code is stored by the user in a place of their choosing (a text file they save somewhere on a computer, or in a service somewhere)

- [ ] Implement an API endpoint for downloading recovery codes for an account
- [ ] Figure out if they can download only once, and if so, add logic to prevent downloading multiple times
- [ ] Also, registered when they are used, so that they can't be re-used again