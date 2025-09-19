// Dependencies
import fastifyCookie from "@fastify/cookie";
import fastify from "fastify";
import config from "./config";
import recoveryCodes from "./controllers/recoveryCodes";
import sessions from "./controllers/sessions";
import users from "./controllers/users";
import { authenticateSession } from "./middleware";

const app = fastify({ logger: false });
app.register(fastifyCookie, {
	secret: config.cookieSecret, // for cookies signature
	hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
	parseOptions: {}, // options for parsing cookies
});

const routes = [
	{ method: "POST", url: "/signup", handler: users.signup },
	{ method: "POST", url: "/login", handler: sessions.create },
	{ method: "POST", url: "/login/mfa", handler: sessions.mfaLogin },
	{
		method: "POST",
		url: "/auth/mfa/recovery-codes",
		preHandler: [authenticateSession],
		handler: recoveryCodes.create,
	},
	{
		method: "POST",
		url: "/auth/mfa/setup",
		preHandler: [authenticateSession],
		handler: users.setupMFATOTP,
	},
	{
		method: "POST",
		url: "/auth/mfa/verify",
		preHandler: [authenticateSession],
		handler: users.verifyMFATOTP,
	},
	{
		method: "POST",
		url: "/auth/mfa/disable",
		preHandler: [authenticateSession],
		handler: users.disableMFATOTP,
	},
	{
		method: "POST",
		url: "/auth/mfa/disable-with-recovery-code",
		preHandler: [authenticateSession],
		handler: users.disableMFATOTPWithRecoveryCode,
	},
];

routes.forEach((route) => app.route(route));

export default app;
