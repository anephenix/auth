import auth from "../auth";
import detectClientType from "../helpers/detectClientType";
import handleError from "../helpers/handleError";
import { Session } from "../models/Session";
import { User } from "../models/User";

const controller = {
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
						secure: true,
						sameSite: "strict",
						path: "/",
						maxAge: auth.accessTokenExpiresIn,
					})
					.setCookie("refresh_token", refresh_token, {
						httpOnly: true,
						secure: true,
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
};

export default controller;
