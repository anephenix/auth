import type { FastifyReply, FastifyRequest } from "fastify";
import auth from "../auth";
import ForgotPassword from "../models/ForgotPassword";
import { User } from "../models/User";

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

	/*
		NOTE - We can DRY up the logic for these 2 controller endpoints later
	*/
	reset: async (request: FastifyRequest, reply: FastifyReply) => {
		const { selector, token, password, password_confirmation } =
			request.body as {
				selector: string;
				token: string;
				password: string;
				password_confirmation: string;
			};

		// Check that password and password_confirmation are provided and match
		if (!password || !password_confirmation) {
			return reply.status(400).send({
				error: "Password and password confirmation are required",
			});
		}

		// Check that password and password_confirmation match
		if (password !== password_confirmation) {
			return reply.status(400).send({
				error: "Password and password confirmation do not match",
			});
		}

		// Validate the new password - respond with error if invalid
		if (!auth.validatePassword(password)) {
			return reply.status(400).send({
				error: "Password does not meet validation rules",
			});
		}

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

		const user = await User.query().findById(forgotPasswordRecord.user_id);
		if (!user) {
			return reply.status(400).send({
				error: "User not found for this password reset request",
			});
		}

		await user.updatePassword(password);
		await forgotPasswordRecord.markAsUsed();

		return reply.send({
			message: "Password reset token is valid",
		});
	},
};

export default controller;
