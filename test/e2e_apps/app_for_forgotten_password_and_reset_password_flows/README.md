# App for forgotten password and reset password flows

## Introduction

This app is testing the use case of using Auth with:

- password authentication enabled
- the password is stored in the users table
- this is a simple setup
- there is a way for the user to reset their password by submitting a forgotten password request

## How would the developer envisage using this?

Perhaps they would instantiate the instance of Auth in a separate file to start with:

```typescript
import { Auth } from "@anephenix/auth";

const auth = new Auth({
    // Options would be set here
});

export default auth;
```

And then that instance of Auth could be loaded wherever it was needed.

So, in the case of the User model, creating a new User would look like this:

```typescript
import User from "./models/User";

try {
    return await User.query().insert({
        username: "testuser",
        password: "ValidPassword123!",
    });
} catch (err) {
    console.log("An error occurred creating the password");
    throw err;
}
```

The code in the User model will do the following:

- Validate the password according to the password validation rules
- Hash the password and store it in the hashed_password field
- Clear the plaintext password so it is no longer in memory (and there is no field to store it in anyway)