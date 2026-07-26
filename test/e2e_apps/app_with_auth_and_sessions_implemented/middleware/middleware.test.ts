import type { FastifyReply, FastifyRequest } from "fastify";
import { beforeEach, describe, expect, it } from "vitest";
import { Session } from "../models/Session";
import { User } from "../models/User";
import { authenticateSession } from "./middleware";

const createMockReply = () => {
	const reply = {
		statusCode: 200,
		body: null as unknown,
		code(status: number) {
			this.statusCode = status;
			return this;
		},
		send(body: unknown) {
			this.body = body;
			return this;
		},
	};
	return reply;
};

const createMockRequest = (
	options: { authorization?: string; cookieToken?: string } = {},
) => {
	return {
		headers: {
			authorization: options.authorization,
		},
		cookies: {
			access_token: options.cookieToken,
		},
		access_token: undefined as string | undefined,
		user: undefined as User | undefined,
	};
};

describe("midddleware", () => {
	beforeEach(async () => {
		await Session.query().delete();
		await User.query().delete();
	});

	describe("#authenticateSession", () => {
		describe("when passed an access token that is valid", () => {
			it("should attach the user to the request object", async () => {
				const user = await User.query().insert({
					username: "testmiddlewareuser1",
					email: "testmiddlewareuser1@example.com",
					password: "Password123!",
				});
				const session = await Session.query().insert({
					user_id: user.id,
					...Session.generateTokens(),
				});

				const request = createMockRequest({
					authorization: `Bearer ${session.access_token}`,
				});
				const reply = createMockReply();

				await authenticateSession(
					request as unknown as FastifyRequest,
					reply as unknown as FastifyReply,
				);

				expect(request.user).toBeDefined();
				expect(request.user?.id).toBe(user.id);
			});

			it("should also attach the access_token to the request object", async () => {
				const user = await User.query().insert({
					username: "testmiddlewareuser2",
					email: "testmiddlewareuser2@example.com",
					password: "Password123!",
				});
				const session = await Session.query().insert({
					user_id: user.id,
					...Session.generateTokens(),
				});

				const request = createMockRequest({
					authorization: `Bearer ${session.access_token}`,
				});
				const reply = createMockReply();

				await authenticateSession(
					request as unknown as FastifyRequest,
					reply as unknown as FastifyReply,
				);

				expect(request.access_token).toBe(session.access_token);
			});

			it("should allow the request to proceed", async () => {
				const user = await User.query().insert({
					username: "testmiddlewareuser3",
					email: "testmiddlewareuser3@example.com",
					password: "Password123!",
				});
				const session = await Session.query().insert({
					user_id: user.id,
					...Session.generateTokens(),
				});

				const request = createMockRequest({
					authorization: `Bearer ${session.access_token}`,
				});
				const reply = createMockReply();

				await authenticateSession(
					request as unknown as FastifyRequest,
					reply as unknown as FastifyReply,
				);

				expect(reply.statusCode).toBe(200);
			});
		});

		describe("when passed an access token that is invalid", () => {
			it("should not attach the user or the access_token to the request object", async () => {
				const request = createMockRequest({
					authorization: "Bearer invalid_token",
				});
				const reply = createMockReply();

				await authenticateSession(
					request as unknown as FastifyRequest,
					reply as unknown as FastifyReply,
				);

				expect(request.user).toBeUndefined();
				expect(request.access_token).toBeUndefined();
			});

			it("should respond with a 401 Unauthorized status", async () => {
				const request = createMockRequest({
					authorization: "Bearer invalid_token",
				});
				const reply = createMockReply();

				await authenticateSession(
					request as unknown as FastifyRequest,
					reply as unknown as FastifyReply,
				);

				expect(reply.statusCode).toBe(401);
			});
		});

		describe("when passed no access token", () => {
			it("should not attach the user to the request object", async () => {
				const request = createMockRequest();
				const reply = createMockReply();

				await authenticateSession(
					request as unknown as FastifyRequest,
					reply as unknown as FastifyReply,
				);

				expect(request.user).toBeUndefined();
			});

			it("should respond with a 401 Unauthorized status", async () => {
				const request = createMockRequest();
				const reply = createMockReply();

				await authenticateSession(
					request as unknown as FastifyRequest,
					reply as unknown as FastifyReply,
				);

				expect(reply.statusCode).toBe(401);
			});
		});
	});
});
