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

/*
    TODO - lookup routeList setup in APIs for past apps

    - https://github.com/anephenix/xxxx/blob/master/routeList.js

    const routes = [];
*/

/*
    This is a preHandler function for Fastify that will authenticate the session
    by checking the access token in the request headers and verifying it against the database.
    If the session is valid, it will attach the user to the request object for downstream handlers
    If the session is invalid, it will return a 401 Unauthorized response.
*/
// const authenticateSession = async (request, reply) => {
// 	const access_token =
// 		request.headers.authorization?.replace("Bearer ", "") ||
// 		request.cookies?.access_token;

// 	if (!access_token) {
// 		reply.code(401).send({ error: "Unauthorized" });
// 		return;
// 	}

// 	const session = await Session.query().findOne({ access_token });
// 	if (!session) {
// 		reply.code(401).send({ error: "Invalid session" });
// 		return;
// 	}
// 	if (session.accessTokenHasExpired()) {
// 		reply.code(401).send({ error: "Access token has expired" });
// 		return;
// 	}

// 	const user = await session.$relatedQuery("user");

// 	if (!user) {
// 		reply.code(401).send({ error: "Invalid session" });
// 		return;
// 	}

// 	// Attach user to request for downstream handlers
// 	request.access_token = session.access_token;
// 	request.user = user;
// };

app.post("/magic-links", magicLinks.create);

// app.post("/login", sessions.create);
// app.get("/profile", { preHandler: [authenticateSession] }, users.profile);
// app.post("/logout", { preHandler: [authenticateSession] }, sessions.logout);
// app.post("/auth/refresh", sessions.refresh);
// app.get("/sessions", { preHandler: [authenticateSession] }, sessions.index);
// app.delete(
// 	"/sessions",
// 	{ preHandler: [authenticateSession] },
// 	sessions.deleteAll,
// );
// app.delete(
// 	"/sessions/:id",
// 	{ preHandler: [authenticateSession] },
// 	sessions.delete,
// );

export default app;
