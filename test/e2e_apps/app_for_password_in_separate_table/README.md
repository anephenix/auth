# App for password in separate table

## Introduction

This app is testing the use case of using Auth with:

- password authentication enabled
- the password is stored in a separate table, and associated with another entity (a user)
- the idea is to check that it can be used that way, and to see if it is a good idea.

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
    return await User.transaction(async (trx) => {
        const user = await User.query(trx).insert({
            username: "testuser",
        });

        const validPassword = await user
            .$relatedQuery("passwords", trx)
            .insert({ password: "ValidPassword123!" });
        return validPassword;
    });
} catch (err) {
    console.log("An error occurred creating the password");
    throw err;
}
```

Because we create a user record and a password record (and we want either both to be created or none at all), we do this via a transaction.