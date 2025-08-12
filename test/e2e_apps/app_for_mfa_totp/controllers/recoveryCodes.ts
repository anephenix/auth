import { RecoveryCode } from "../models/RecoveryCode";
import type { User } from "../models/User";

const controller = {
	create: async (request, reply) => {
		const user = request.user as User;
		if (!user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		const codes = await RecoveryCode.generateCodes();

		// TODO - look at optimising this later so that it can be done in a single query
		for (const code of codes) {
			await RecoveryCode.query().insert({
				user_id: user.id,
				code,
			});
		}

		return reply.status(201).send({ codes });
	},
};

export default controller;
