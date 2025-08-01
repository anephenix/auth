import { access } from "node:fs";
import auth from "../auth";
import detectClientType from "../helpers/detectClientType";
import handleError from "../helpers/handleError";
import { Session } from "../models/Session";
import { User } from "../models/User";

/*
	This is used to toggle cookie security when running 
	on development/test environments versus production.
*/
const secureCookieEnabled = process.env.NODE_ENV === "production";

const controller = {
	index: async (request, reply) => {
		const sessions = await Session.query()
			.select("id", "user_agent", "ip_address", "created_at", "updated_at")
			.where("user_id", request.user.id);
		reply.status(200).send(sessions);
	},

	create: async (request, reply) => {
		const { identifier, password } = request.body as {
			identifier: string;
			password: string;
		};
		try {
			if (!identifier)
				throw new Error("Please provide your username or email address");
			if (!password) throw new Error("Password is required");

			const user = await User.authenticate({ identifier, password });
			if (!user) {
				return reply.status(401).send({ error: "Invalid credentials" });
			}
			// Create the session
			const session = await Session.query().insert({
				user_id: user.id,
				...Session.generateTokens(),
			});

			const {
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			} = session;

			const clientType = detectClientType(request);
			if (clientType === "web") {
				reply
					.status(201)
					.setCookie("access_token", access_token, {
						httpOnly: true,
						secure: secureCookieEnabled,
						sameSite: "strict",
						path: "/",
						maxAge: auth.accessTokenExpiresIn,
					})
					.setCookie("refresh_token", refresh_token, {
						httpOnly: true,
						secure: secureCookieEnabled,
						sameSite: "strict",
						path: "/auth/refresh", // We send the cookie only to the refresh token endpoint
						maxAge: auth.refreshTokenExpiresIn,
					})
					.send("Authenticated successfully");
			} else {
				reply.status(201).send({
					access_token,
					refresh_token,
					access_token_expires_at,
					refresh_token_expires_at,
				});
			}
		} catch (error) {
			const errorMessage = handleError(error);
			reply.status(401).send({ error: errorMessage });
		}
	},

	logout: async (request, reply) => {
		const user = request.user;
		const access_token = request.access_token;
		if (!user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		try {
			await Session.query()
				.delete()
				.where({ user_id: user.id, access_token: access_token });
			reply
				.clearCookie("access_token")
				.clearCookie("refresh_token")
				.send({ message: "Logged out successfully" });
		} catch (error) {
			const errorMessage = handleError(error);
			reply.status(500).send({ error: errorMessage });
		}
	},

	// TODO - implement based on client being web or api
	refresh: async (request, reply) => {
		const clientType = detectClientType(request);
		// If it is defined in the cookie, get it there
		let refresh_token = request.cookies?.refresh_token;

		// Otherwsie, get it from the JSON body
		if (!refresh_token) {
			refresh_token = request.body?.refresh_token;
		}

		// If it is not defined in either place, return unauthorized
		if (!refresh_token) {
			return reply.status(401).send({ error: "No refresh token provided" });
		}

		const session = await Session.query().findOne({ refresh_token });
		if (!session || session.refreshTokenHasExpired()) {
			return reply
				.status(401)
				.send(
					clientType === "web"
						? "Invalid or expired refresh token"
						: { error: "Invalid or expired refresh token" },
				);
		}

		// Generate a new access token for the session, and update the session
		const updatedSessionTokens = Session.generateTokens();

		const newSession = await session.$query().patchAndFetch({
			access_token: updatedSessionTokens.access_token,
			access_token_expires_at: updatedSessionTokens.access_token_expires_at,
		});

		if (clientType === "web") {
			reply
				.setCookie("access_token", newSession.access_token, {
					httpOnly: true,
					secure: secureCookieEnabled,
					sameSite: "strict",
					path: "/",
					maxAge: auth.accessTokenExpiresIn,
				})
				.status(201)
				.send("Token refreshed successfully");
		} else if (clientType === "api") {
			reply.status(201).send({
				access_token: newSession.access_token,
				access_token_expires_at: newSession.access_token_expires_at,
				refresh_token: newSession.refresh_token,
				refresh_token_expires_at: newSession.refresh_token_expires_at,
			});
		}
	},

	delete: async (request, reply) => {
		const sessionId = request.params.id;
		const user = request.user;
		const session = await Session.query()
			.where({ id: sessionId, user_id: user.id })
			.first();
		if (!session) {
			return reply.status(404).send({ error: "Session not found" });
		}

		if (session.user_id !== request.user.id) {
			return reply.status(403).send({ error: "Forbidden" });
		}

		// Prevents a user from deleting their active session
		if (session.access_token === request.access_token) {
			return reply.status(409).send({
				error: "conflict",
				message:
					"Cannot delete the active session. Use the /logout endpoint instead.",
			});
		}

		await session.$query().delete();
		const clientType = detectClientType(request);
		const message = "Session deleted successfully";
		reply.status(200).send(clientType === "web" ? message : { message });
	},

	deleteAll: async (request, reply) => {
		const user = request.user;
		if (!user) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		try {
			// Delete all sessions for the user except the current session that they are using
			await Session.query()
				.delete()
				.where({ user_id: user.id })
				.whereNot({ access_token: request.access_token });
			reply.status(200).send({ message: "Sessions deleted successfully" });
		} catch (error) {
			const errorMessage = handleError(error);
			reply.status(500).send({ error: errorMessage });
		}
	},
};

export default controller;
