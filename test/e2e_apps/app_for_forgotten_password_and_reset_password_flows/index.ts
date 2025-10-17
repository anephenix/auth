// Dependencies
// import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
// import config from "./config";
import forgotPassword from "./controllers/forgot_password";
import resetPassword from "./controllers/reset_password";

const app = fastify({ logger: false });
// app.register(fastifyCookie, {
// 	secret: config.cookieSecret, // for cookies signature
// 	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
// 	parseOptions: {}, // options for parsing cookies
// });

const routes = [
	{ method: "POST", url: "/forgot-password", handler: forgotPassword.create },
	{
		method: "GET",
		url: "/reset-password/:selector",
		handler: resetPassword.get,
	},
	{
		method: "POST",
		url: "/reset-password",
		handler: resetPassword.reset,
	},
];

routes.forEach((route) => {
	app.route(route);
});

export default app;
