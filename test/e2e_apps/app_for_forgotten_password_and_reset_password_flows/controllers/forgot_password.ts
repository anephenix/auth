import type { FastifyReply, FastifyRequest } from "fastify";
import { isEmail } from "../../../utils/comparators";
import auth from "../auth";
import forgotPasswordRequestQueue from "../queues/ForgotPasswordRequestQueue";

const controller = {
	create: async (request: FastifyRequest, reply: FastifyReply) => {
		const { identifier } = request.body as {
			identifier: string;
		};

		const normalizedIdentifier = auth.normalize(identifier ? identifier : "");
		const isEmailAddress = isEmail(normalizedIdentifier);

		await forgotPasswordRequestQueue.add({
			name: "check-if-user-exists-and-send-email",
			data: {
				identifier: normalizedIdentifier,
				isEmail: isEmailAddress,
			},
		});

		return reply.send({
			message:
				"If an account with that username/email exists, we've sent password reset instructions.",
		});
	},
};

export default controller;
