# Auth

An authentication library for apps.

[![Node.js CI](https://github.com/anephenix/auth/actions/workflows/node.js.yml/badge.svg)](https://github.com/anephenix/auth/actions/workflows/node.js.yml)

## Install

```shell
npm i @anephenix/auth
```

## Usage

If you have a fastify app, you can attach it as a plugin.

```typescript
import fastify from 'fastify';
import User from './models/User';
import auth from '@anephenix/auth';

const app = fastify({ logger: false });

app.register(auth, {
	model: User,
});
```

<i>

Is this enough? For it to work, we'd need for the User model:

- to have the method to perform the act of encrypting the password
- to have the required fields for looking up the username/email and then the hashed password to lookup
- to have a method to find the User and verify the password is correct

We would also need to work out how sessions are created/retrieved/stored

- What is used to create the session, a Redis instance for example?
- What is used to retrive the session

Therefore, we would we need to:

- Generate a migration to add those fields to the model, and run that
- Attach functions to the model to handle hashing the password when the user is created and updated
- Attach a function tot he mdoel to handle verifying that the user is found and authenticated when they provide the correct password, or not

And this is just for the simple username/password setup. It does not take into consideration the other options:

- Using MFA for the user (so that a compromised password or reset-password method alone cannot be used to get access into the system)
- Using a magic link sent to the email address for logging in instead.

These are details that will emerge once we get into the details of implementing this system

</i>
