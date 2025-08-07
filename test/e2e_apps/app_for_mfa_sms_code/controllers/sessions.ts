import auth from "../auth";
// import detectClientType from '../helpers/detectClientType';
import handleError from "../helpers/handleError";
import { Session } from "../models/Session";
import { SmsCode } from "../models/SmsCode";
import { User } from "../models/User";

import smsCodeQueue from "../queues/SmsCodeQueue";

const controller = {
	create: async (request, reply) => {
		try {
			const { identifier, password } = request.body as {
				identifier: string;
				password: string;
			};

			if (!identifier)
				throw new Error("Please provide your username or email address");
			if (!password) throw new Error("Password is required");

			const user = await User.authenticate({ identifier, password });
			if (!user) {
				return reply.status(401).send({ error: "Invalid credentials" });
			}

			// Generate a random code and set the expiration time
			const { token, code, hashedCode, expiresAt } =
				await auth.generateSmsCode();

			// For the SmsCode to be sent, the user's mobile number would need to be stored somewhere and used for sending the SMS to.
			await SmsCode.query().insert({
				user_id: user.id,
				token, // Store the token for secure verification later
				hashed_code: hashedCode,
				expires_at: expiresAt.toISOString(),
			});

			const job = {
				name: "sendSmsCode",
				data: {
					mobile_number: user.mobile_number,
					code,
				},
			};
			await smsCodeQueue.add(job);
			return reply.status(201).send({
				token,
				message:
					"Authentication successful. SMS code sent to verify authentication",
			});
		} catch (error) {
			const errorMessage = handleError(error);
			reply.status(401).send({ error: errorMessage });
		}
	},

	verifyCode: async (request, reply) => {
		try {
			const { token, code } = request.body as {
				code: string;
				token: string;
			};

			// TODO - add unit tests to cover these cases
			// if (!token) {
			// 	return reply.status(400).send({ error: "Token is required" });
			// }
			// if (!code) {
			// 	return reply.status(400).send({ error: "Code is required" });
			// }

			// We use the token to find the SmsCode record
			const smsCode = await SmsCode.query().findOne({ token });

			if (!smsCode) {
				return reply.status(400).send({ error: "Invalid token" });
			}

			// TODO - add unit tests to cover these cases

			// if (smsCode.used_at) {
			// 	return reply.status(400).send({ error: "SMS code has already been used" });
			// }

			// if (smsCode.codeHasExpired()) {
			// 	return reply.status(400).send({ error: "SMS code has expired" });
			// }

			const isCodeValid = await smsCode.verifyCode(code);

			if (!isCodeValid) {
				return reply.status(400).send({ error: "Invalid code" });
			}
			// Mark the code as used - Question - should this be done in a model action instead?
			await smsCode.$query().patch({ used_at: new Date().toISOString() });
			const session = await Session.query().insert({
				user_id: smsCode.user_id,
				...Session.generateTokens(),
			});
			const {
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			} = session;

			return reply.status(201).send({
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
			});
		} catch (error) {
			const errorMessage = handleError(error);
			reply.status(401).send({ error: errorMessage });
		}
	},
};

export default controller;
