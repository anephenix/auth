import auth from "../auth";
// import detectClientType from '../helpers/detectClientType';
import handleError from "../helpers/handleError";
// import { Session } from '../models/Session';
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
			const { code, hashedCode, expiresAt } = await auth.generateSmsCode();

			// For the SmsCode to be sent, the user's mobile number would need to be stored somewhere and used for sending the SMS to.
			await SmsCode.query().insert({
				user_id: user.id,
				hashed_code: hashedCode,
				expires_at: expiresAt,
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
				message:
					"Authentication successful. SMS code sent to verify authentication",
			});
		} catch (error) {
			const errorMessage = handleError(error);
			reply.status(401).send({ error: errorMessage });
		}
	},

	verifyCode: async (request, reply) => {},

	// // TODO - complete this
	// create: async (request, reply) => {
	//     try {
	//         const { identifier, password } = request.body as {
	//             identifier: string;
	//             password: string;
	//         };
	//         try {
	//             if (!identifier)
	//                 throw new Error("Please provide your username or email address");
	//             if (!password) throw new Error("Password is required");

	//             const user = await User.authenticate({ identifier, password });
	//             if (!user) {
	//                 return reply.status(401).send({ error: "Invalid credentials" });
	//             }
	//             // Create the session

	//         // Generate a random code and set the expiration time
	//         const { code, hashedCode, expiresAt } = auth.generateSmsCode();

	//         // For the SmsCode to be sent, the user's mobile number would need to be stored somewhere and used for sending the SMS to.

	//         const smsCode = await SmsCode.query().insert({
	//             user_id: user.id,
	//             hashed_code: hashedCode,
	//             expires_at: expiresAt,
	//         });

	//         // TODO - create that method in auth
	//         // TODO - put the plaintext code somewhere safe, in a job queue

	//         reply.send({ message: "Session created successfully" });
	//     } catch (error) {
	//         const errorMessage = handleError(error);
	//         reply.status(401).send({ error: errorMessage });
	//     }
	// },

	// // TODO - complete this
	// verifyCode: async (request, reply) => {
	//     const { code } = request.body;

	//     // Here you would handle the verification of the MFA code.
	//     // This is a placeholder for your code verification logic.
	//     if (!code) {
	//         throw new Error("Code is required for verification");
	//     }

	//     // Create the session
	//     const session = await Session.query().insert({
	//         user_id: user.id,
	//         ...Session.generateTokens(),
	//     });

	//     const {
	//         access_token,
	//         refresh_token,
	//         access_token_expires_at,
	//         refresh_token_expires_at,
	//     } = session;

	//     const clientType = detectClientType(request);
	//     if (clientType === "web") {
	//         reply
	//             .status(201)
	//             .setCookie("access_token", access_token, {
	//                 httpOnly: true,
	//                 secure: secureCookieEnabled,
	//                 sameSite: "strict",
	//                 path: "/",
	//                 maxAge: auth.accessTokenExpiresIn,
	//             })
	//             .setCookie("refresh_token", refresh_token, {
	//                 httpOnly: true,
	//                 secure: secureCookieEnabled,
	//                 sameSite: "strict",
	//                 path: "/auth/refresh", // We send the cookie only to the refresh token endpoint
	//                 maxAge: auth.refreshTokenExpiresIn,
	//             })
	//             .send("Authenticated successfully");
	//     } else {
	//         reply.status(201).send({
	//             access_token,
	//             refresh_token,
	//             access_token_expires_at,
	//             refresh_token_expires_at,
	//         });
	//     }
	//     // Simulate successful verification
	//     reply.send({ message: "Code verified successfully" });
	// }
};

export default controller;
