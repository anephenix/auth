import { isEmail } from "../../../utils/comparators";
import handleError from "../helpers/handleError";
import { MagicLink } from "../models/MagicLink";
import { Session } from "../models/Session";
import { User } from "../models/User";
import emailService from "../services/email";

const controller = {
	create: async (request, reply) => {
		try {
			/*
            We want to do the following:
            - Check that the email is present and a valid email address.
            - Check that a user exists with that email address.
            - If the user exists, create a magic link for that user.
            - Send the magic link to the user's email address.
            - If the user does not exist, return an error.        
        */

			/*
			Perhaps at some point, you could move this into the services 
			architecture that you did in other repos.
		*/

			if (!request.body.email)
				throw new Error("No email provided - please provide an email");

			const { email } = request.body;
			const checkIsEmail = isEmail(email);
			if (!checkIsEmail) {
				throw new Error("Invalid email address");
			}

			const user = await User.query().where({ email }).first();
			if (!user) {
				throw new Error("User not found for email");
			}

			/*
            We generate the token, token expiry time, code and hashed code here
        */
			const { token, tokenExpiresAt, code, hashedCode } =
				await MagicLink.generateTokens();

			/*
            We create the magic link record in the database with the user_id, 
            token, expiry time and hashed code.
        */
			await MagicLink.query().insert({
				user_id: user.id,
				token,
				hashed_code: hashedCode,
				expires_at: tokenExpiresAt.toISOString(),
			});

			await emailService.sendMagicLinkEmail({
				to: user.email,
				token,
				code,
				tokenExpiresAt,
			});

			const message = "Magic link created";
			// Response with a success message in the API JSON response
			reply.code(201).send({ message });
		} catch (err) {
			const error = handleError(err);
			reply.status(400).send({ error });
		}
	},

	verify: async (request, reply) => {
		try {
			const { token, code } = request.body;

			if (!token || !code) {
				throw new Error("Token and code are required");
			}

			const { userId } = await MagicLink.verifyTokenAndCode(token, code);

			// Create a session for the user
			const session = await Session.query().insert({
				user_id: userId,
				...Session.generateTokens(),
			});

			const {
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			} = session;

			reply.code(201).send({
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			});
		} catch (err) {
			const error = handleError(err);
			reply.status(400).send({ error });
		}
	},
};

export default controller;
