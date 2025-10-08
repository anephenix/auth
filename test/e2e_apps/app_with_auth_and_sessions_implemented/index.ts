// Dependencies
import fastifyResource from "@anephenix/fastify-resource";
import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import config from "./config";
import sessions from "./controllers/sessions";
import users from "./controllers/users";
import { authenticateSession } from "./middleware";
import { User } from "./models/User";

const app = fastify({ logger: false });

app.register(fastifyCookie, {
	secret: config.cookieSecret, // for cookies signature
	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
	parseOptions: {}, // options for parsing cookies
});

/* This would potentially let us add routes in a way that we can load them from npm modules and chain them together */
const routes = [
	{ method: "POST", url: "/signup", handler: users.create },
	{ method: "POST", url: "/login", handler: sessions.create },
	{
		method: "GET",
		url: "/profile",
		preHandler: [authenticateSession],
		handler: users.profile,
	},
	{
		method: "POST",
		url: "/logout",
		preHandler: [authenticateSession],
		handler: sessions.logout,
	},
	{ method: "POST", url: "/auth/refresh", handler: sessions.refresh },
	{
		method: "GET",
		url: "/sessions",
		preHandler: [authenticateSession],
		handler: sessions.index,
	},
	{
		method: "DELETE",
		url: "/sessions",
		preHandler: [authenticateSession],
		handler: sessions.deleteAll,
	},
	{
		method: "DELETE",
		url: "/sessions/:id",
		preHandler: [authenticateSession],
		handler: sessions.delete,
	},
];

// This adds each route to the Fastify app
routes.forEach((route) => {
	app.route(route);
});

app.register(fastifyResource, {
	model: User,
	resourceList: "user",
});

export default app;
