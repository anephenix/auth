// Dependencies
import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import config from "./config";

import sessions from "./controllers/sessions";

const app = fastify({ logger: false });
app.register(fastifyCookie, {
	secret: config.cookieSecret, // for cookies signature
	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
	parseOptions: {}, // options for parsing cookies
});

const routes = [
	{ method: "POST", url: "/sessions", handler: sessions.create },
	{
		method: "POST",
		url: "/sessions/verify-code",
		handler: sessions.verifyCode,
	},
];

routes.forEach((route) => {
	app.route(route);
});

export default app;
