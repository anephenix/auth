import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Session } from "./Session";
import { User } from "./User";

const makeInvalidSession = async () => {
	const session = new Session();
	session.$validate();
};

const isIsoString = (date: string) => {
	const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
	return isoRegex.test(date);
};

describe("Session Model", () => {
	let user: User;

	beforeAll(async () => {
		await User.query().delete();
		user = await User.query().insert({
			username: "testuser",
			email: "testuser@example.com",
			password: "ValidPassword123!",
		});
	});

	beforeEach(async () => {
		await Session.query().delete();
	});

	describe("validations", () => {
		it("should have a user_id", async () => {
			await expect(makeInvalidSession).rejects.toThrowError(
				"user_id: must have required property 'user_id'",
			);
		});

		it("should have an access_token", async () => {
			await expect(makeInvalidSession).rejects.toThrowError(
				"access_token: must have required property 'access_token'",
			);
		});

		it("should have an refresh_token", async () => {
			await expect(makeInvalidSession).rejects.toThrowError(
				"refresh_token: must have required property 'refresh_token'",
			);
		});

		it("should have an access_token_expires_at", async () => {
			await expect(makeInvalidSession).rejects.toThrowError(
				"access_token_expires_at: must have required property 'access_token_expires_at'",
			);
		});

		it("should have a refresh_token_expires_at", async () => {
			await expect(makeInvalidSession).rejects.toThrowError(
				"refresh_token_expires_at: must have required property 'refresh_token_expires_at'",
			);
		});
		it("should have a created_at timestamp", async () => {
			const session = await Session.query().insert({
				user_id: user.id,
				...Session.generateTokens(),
			});
			expect(session.created_at).toBeDefined();
			expect(isIsoString(session.updated_at)).toBe(true);
		});
		it("should have an updated_at timestamp", async () => {
			const session = await Session.query().insert({
				user_id: user.id,
				...Session.generateTokens(),
			});
			expect(session.updated_at).toBeDefined();
			expect(isIsoString(session.updated_at)).toBe(true);
		});

		it("can have a user_agent", async () => {
			const userAgent =
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3";
			const session = await Session.query().insert({
				user_id: user.id,
				...Session.generateTokens(),
				user_agent: userAgent,
			});
			expect(session.user_agent).toBe(userAgent);
		});
		it("can have an ip_address", async () => {
			const ipAddress = "192.168.1.1";
			const session = await Session.query().insert({
				user_id: user.id,
				...Session.generateTokens(),
				ip_address: ipAddress,
			});
			expect(session.ip_address).toBe(ipAddress);
		});
	});

	describe("hooks", () => {
		describe("before inserting a new record", () => {
			it("should set the created_at and updated_at timestamps before insert", async () => {
				const session = await Session.query().insert({
					user_id: user.id,
					...Session.generateTokens(),
				});
				expect(session.created_at).toBeDefined();
				expect(isIsoString(session.created_at)).toBe(true);
				expect(session.updated_at).toBeDefined();
				expect(isIsoString(session.updated_at)).toBe(true);
			});
		});

		describe("before updating a record", () => {
			it("should update the updated_at timestamp before update", async () => {
				const session = await Session.query().insert({
					user_id: user.id,
					...Session.generateTokens(),
				});
				session.user_agent =
					"WebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3";
				await session.$query().update();
				expect(session.updated_at).toBeDefined();
				expect(isIsoString(session.updated_at)).toBe(true);
				expect(session.updated_at).not.toBe(session.created_at);
			});
		});
	});

	describe("static methods", () => {
		describe("generateTokens", () => {
			it("should generate tokens", () => {
				const tokens = Session.generateTokens();
				expect(tokens).toHaveProperty("access_token");
				expect(tokens).toHaveProperty("refresh_token");
				expect(tokens).toHaveProperty("access_token_expires_at");
				expect(tokens).toHaveProperty("refresh_token_expires_at");
			});
		});
	});

	describe("instance methods", () => {
		describe("accessTokenHasExpired", () => {
			it("should return true if the access token has expired", () => {
				const session = new Session();
				session.access_token_expires_at = new Date(
					Date.now() - 1000,
				).toISOString();
				expect(session.accessTokenHasExpired()).toBe(true);
			});

			it("should return false if the access token has not expired", () => {
				const session = new Session();
				session.access_token_expires_at = new Date(
					Date.now() + 1000,
				).toISOString();
				expect(session.accessTokenHasExpired()).toBe(false);
			});
		});

		describe("refreshTokenHasExpired", () => {
			it("should return true if the refresh token has expired", () => {
				const session = new Session();
				session.refresh_token_expires_at = new Date(
					Date.now() - 1000,
				).toISOString();
				expect(session.refreshTokenHasExpired()).toBe(true);
			});

			it("should return false if the refresh token has not expired", () => {
				const session = new Session();
				session.refresh_token_expires_at = new Date(
					Date.now() + 1000,
				).toISOString();
				expect(session.refreshTokenHasExpired()).toBe(false);
			});
		});
	});
});
