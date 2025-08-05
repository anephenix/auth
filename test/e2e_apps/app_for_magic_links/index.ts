// Dependencies
import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import config from "./config";
import magicLinks from "./controllers/magic_links";

// import sessions from "./controllers/sessions";
// import users from "./controllers/users";
// import { Session } from "./models/Session";

const app = fastify({ logger: false });
app.register(fastifyCookie, {
	secret: config.cookieSecret, // for cookies signature
	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
	parseOptions: {}, // options for parsing cookies
});

app.post("/magic-links", magicLinks.create);
app.post("/magic-links/verify", magicLinks.verify);

export default app;
