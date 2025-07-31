import handleError from "../helpers/handleError";
import { User } from "../models/User";

const controller = {
	create: async (request, reply) => {
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
	},

	profile: async (request, reply) => {
		const user = request.user;
		if (!user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}
		reply.send({ id: user.id, username: user.username, email: user.email });
	},
};

export default controller;
