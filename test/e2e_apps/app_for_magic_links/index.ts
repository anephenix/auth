// Dependencies
import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import config from "./config";
import magicLinks from "./controllers/magic_links";

const app = fastify({ logger: false });
app.register(fastifyCookie, {
	secret: config.cookieSecret, // for cookies signature
	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
	parseOptions: {}, // options for parsing cookies
});

const routes = [
	{ method: "POST", url: "/magic-links", handler: magicLinks.create },
	{ method: "POST", url: "/magic-links/verify", handler: magicLinks.verify },
];

routes.forEach((route) => {
	app.route(route);
});

export default app;
