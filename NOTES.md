# NOTES

What if, instead of organising the code in terms of this:

/routes
/controllers
/services
/models

You organised it like this:

/auth
/auth/routes
/auth/controllers/
/auth/services/
/auth/models

That way, you can bundle up functionality in a way that it can be modularised and re-used easily.

I think that the bit that will have to be centralised though is the models, as they tend to store data centrally.

So in that case, the model needs to be passed into the service in some way, upon initialization.

e.g.

```javascript
class AuthService {
	constructor({ models }) {
		this.models = models;
	}

	async generateSession(user) {
		const session = await this.models.session.create({ userId: user.id });
		return session;
	}

	async login({ username, password }) {
		const user = await this.models.user.find({ username });
		if (!user) throw new Error('User not found');
		const authenticated = await user.authenticate(password);
		if (!authenticated) throw new Error('Password invalid');
		const session = generateSession(user);
		return { id: session.id, token: session.token, expires: session.expires };
	}
}
```

This way, you can load the auth module as an npm module and attach it to an application easily.

To install the app, you do this in the following order:

1. Instantiate the Auth service with the models passed in
2. Instantiate the Auth controller with the auth service instance
3. Instantiate the Auth routes with the auth controller
4. Have the app bind the REST routes into the app

This way, you can load the npm modules into an app easily.

Like this:

```javascript
const models = {};

AuthModule({
	models: models,
	multFactorAuth: true,
	magicLink: true,
});
```
