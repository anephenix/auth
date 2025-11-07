import type { FastifyReply, FastifyRequest } from "fastify";
import { Session } from "./models/Session.js";

/*
    This is a preHandler function for Fastify that will authenticate the session
    by checking the access token in the request headers and verifying it against the database.
    If the session is valid, it will attach the user to the request object for downstream handlers
    If the session is invalid, it will return a 401 Unauthorized response.
*/

type AuthenticatedRequest = FastifyRequest & {
	access_token?: string;
	user?: any;
};

const authenticateSession = async (
	request: AuthenticatedRequest,
	reply: FastifyReply,
) => {
	const access_token =
		request.headers.authorization?.replace("Bearer ", "") ||
		request.cookies?.access_token;

	if (!access_token) {
		reply.code(401).send({ error: "Unauthorized" });
		return;
	}

	const session = await Session.query().findOne({ access_token });
	if (!session) {
		reply.code(401).send({ error: "Invalid session" });
		return;
	}
	if (session.accessTokenHasExpired()) {
		reply.code(401).send({ error: "Access token has expired" });
		return;
	}

	const user = await session.$relatedQuery("user");

	if (!user) {
		reply.code(401).send({ error: "Invalid session" });
		return;
	}

	// Attach user to request for downstream handlers
	request.access_token = session.access_token;
	request.user = user;
};

export { authenticateSession };
