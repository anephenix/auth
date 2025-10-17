import type { FastifyReply, FastifyRequest } from "fastify";
import auth from "../auth";
import ForgotPassword from "../models/ForgotPassword";

const controller = {
	get: async (request: FastifyRequest, reply: FastifyReply) => {
		const { selector } = request.params as {
			selector: string;
		};

		const { token } = request.query as {
			token: string;
		};

		// Find the forgot password record by selector
		const forgotPasswordRecord = await ForgotPassword.query()
			.where("selector", selector)
			.first();

		if (!forgotPasswordRecord) {
			return reply.status(400).send({
				error: "Invalid reset password selector or token",
			});
		}

		if (forgotPasswordRecord.expires_at < new Date()) {
			return reply.status(400).send({
				error: "Password reset token has expired",
			});
		}

		if (forgotPasswordRecord.used_at) {
			return reply.status(400).send({
				error: "Password reset token has already been used",
			});
		}

		// Here you would normally verify the token against the hashed token in the database
		// and check for expiration, but this is omitted for brevity.
		const isTokenValid = await auth.verifyPassword(
			token,
			forgotPasswordRecord.token_hash,
		);

		if (!isTokenValid) {
			return reply.status(400).send({
				error: "Invalid reset password selector or token",
			});
		}

		return reply.send({
			message: "Password reset token is valid",
		});
	},
};

export default controller;
