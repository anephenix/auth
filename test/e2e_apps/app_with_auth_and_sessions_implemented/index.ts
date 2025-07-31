/*
    I think that this is where the fastify instance is created and the routes 
    are defined.

    As for a running server, we could load that in a server.js file for it to 
    run and listen on a port.

    Whereas in the unit tests we can manually get it to listen and to close 
    the server as part of the setup and teardown of the tests.
*/

// Dependencies
import fastify from "fastify";
import handleError from "./helpers/handleError";

// import { Session } from "./models/Session";
import { User } from "./models/User";

const app = fastify({ logger: false });

/*
    TODO - lookup routeList setup in APIs for past apps

    - https://github.com/anephenix/xxxx/blob/master/routeList.js

    const routes = [];

*/

// TODO - at some point, extract the route and controller logic into separate files, and then import them here.
// That way you have a way to define routes in one place, and have them loaded in multiple places, such as in the server.js file and in the tests.
app.post("/signup", async (request, reply) => {
	const { username, email, password } = request.body as {
		username: string;
		email: string;
		password: string;
	};

	try {
		const user = await User.query().insert({
			username,
			email,
			password,
		});

		reply
			.status(201)
			.send({ id: user.id, username: user.username, email: user.email });
	} catch (error) {
		const errorMessage = handleError(error);
		reply.status(400).send({ error: errorMessage });
	}
});

export default app;
