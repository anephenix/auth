import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { isEmail } from "../../../utils/comparators";
import auth from "../auth";
import forgotPasswordRequestQueue from "../queues/ForgotPasswordRequestQueue";

const IdentifierSchema = z
	.string()
	.min(1)
	.max(255)
	.regex(
		/^([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|[A-Za-z0-9_-]+)$/,
		"Invalid identifier",
	);

const controller = {
	create: async (request: FastifyRequest, reply: FastifyReply) => {
		const { identifier } = request.body as {
			identifier: string;
		};

		try {
			IdentifierSchema.parse(identifier);
		} catch {
			return reply.status(400).send({
				error: "Invalid identifier",
			});
		}

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
