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

// NOTE - this is pseudo Objection.js model creation - update this
const user = new User({username: "paul", password: "letmein" });
await user.save();

/*
    The following would happen in the User model:

    - The password would be validated to check that it met any criteria set in the auth's rules
    - If the pasword is not valid, an error is thrown with a validation rule
    - If the password is valid, then the user is saved
    - When the user is saved, the password is then created in a separate Password table in a database with a reference to the id of the user, as well as a way of identifying that the record belongs to a user.

    This is what we want to explore and look for - how would that code be setup in such a scenario - would we need to implement the code bindings ourselves?

    I think that the code would need to be setup in the User model - only question then is could we abstract that out into a wrapper model a la Objection-Password?

    Maybe, but I think that it could be done better.
*/

```