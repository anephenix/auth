// Dependencies
import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import auth from "./auth";
import config from "./config";
import detectClientType from "./helpers/detectClientType";
import handleError from "./helpers/handleError";
import { Session } from "./models/Session";
import { User } from "./models/User";

const app = fastify({ logger: false });
app.register(fastifyCookie, {
	secret: config.cookieSecret, // for cookies signature
	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
	parseOptions: {}, // options for parsing cookies
});

/*
    TODO - lookup routeList setup in APIs for past apps

    - https://github.com/anephenix/xxxx/blob/master/routeList.js

    const routes = [];
*/

// TODO - at some point, extract the route and controller logic into separate files, and then import them here.
// That way you have a way to define routes in one place, and have them loaded in multiple places, such as in the server.js file and in the tests.
app.post("/signup", async (request, reply) => {
	const { username, email, password } = request.body as {
		username: string;
		email: string;
		password: string;
	};

	try {
		const user = await User.query().insert({
			username,
			email,
			password,
		});

		reply
			.status(201)
			.send({ id: user.id, username: user.username, email: user.email });
	} catch (error) {
		const errorMessage = handleError(error);
		reply.status(400).send({ error: errorMessage });
	}
});

app.post("/login", async (request, reply) => {
	const { identifier, password } = request.body as {
		identifier: string;
		password: string;
	};
	try {
		if (!identifier)
			throw new Error("Please provide your username or email address");
		if (!password) throw new Error("Password is required");

		const user = await User.authenticate({ identifier, password });
		if (!user) {
			return reply.status(401).send({ error: "Invalid credentials" });
		}
		// Create the session
		const session = await Session.query().insert({
			user_id: user.id,
			...Session.generateTokens(),
		});

		const {
			access_token,
			refresh_token,
			access_token_expires_at,
			refresh_token_expires_at,
		} = session;

		const clientType = detectClientType(request);
		if (clientType === "web") {
			reply
				.status(201)
				.setCookie("access_token", access_token, {
					httpOnly: true,
					secure: true,
					sameSite: "strict",
					path: "/",
					maxAge: auth.accessTokenExpiresIn,
				})
				.setCookie("refresh_token", refresh_token, {
					httpOnly: true,
					secure: true,
					sameSite: "strict",
					path: "/auth/refresh", // We send the cookie only to the refresh token endpoint
					maxAge: auth.refreshTokenExpiresIn,
				})
				.send("Authenticated successfully");
		} else {
			reply.status(201).send({
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			});
		}
	} catch (error) {
		const errorMessage = handleError(error);
		reply.status(401).send({ error: errorMessage });
	}
});

export default app;
