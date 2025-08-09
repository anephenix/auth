// Dependencies
import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import config from "./config";
import users from "./controllers/users";
import { authenticateSession } from "./middleware";

const app = fastify({ logger: false });
app.register(fastifyCookie, {
	secret: config.cookieSecret, // for cookies signature
	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
	parseOptions: {}, // options for parsing cookies
});

const routes = [
	{ method: "POST", url: "/signup", handler: users.signup },
	{
		method: "POST",
		url: "/auth/mfa/setup",
		preHandler: [authenticateSession],
		handler: users.setupMFATOTP,
	},
	{
		method: "POST",
		url: "/auth/mfa/verify",
		preHandler: [authenticateSession],
		handler: users.verifyMFATOTP,
	}, // Assuming you have a verify endpoint
];

routes.forEach((route) => app.route(route));

export default app;
