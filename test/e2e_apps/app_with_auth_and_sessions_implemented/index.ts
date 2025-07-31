// Dependencies
import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import config from "./config";
import sessions from "./controllers/sessions";
import users from "./controllers/users";

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

app.post("/signup", users.create);
app.post("/login", sessions.create);

export default app;
