// Dependencies
// import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
// import config from "./config";
import forgotPassword from "./controllers/forgot_password";

const app = fastify({ logger: false });
// app.register(fastifyCookie, {
// 	secret: config.cookieSecret, // for cookies signature
// 	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
// 	parseOptions: {}, // options for parsing cookies
// });

const routes = [
	{ method: "POST", url: "/forgot-password", handler: forgotPassword.create },
];

routes.forEach((route) => {
	app.route(route);
});

export default app;
