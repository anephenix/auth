import { Model } from "objection";
import auth from "../auth";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class MagicLink extends Model {
	id!: number;
	user_id!: number;
	token!: string;
	hashed_code: string;
	used_at?: string;
	expires_at!: string;
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "magic_links";
	}

	/* Generates the access and refresh tokens for the session, as well as their expiration datetimes */
	static async generateTokens() {
		const { token, tokenExpiresAt, code, hashedCode } =
			await auth.generateTokenAndCode();
		return {
			token,
			tokenExpiresAt,
			hashedCode,
			code,
		};
	}

	static async verifyTokenAndCode(token: string, code: string) {
		const magicLink = await MagicLink.query().where({ token }).first();
		if (!magicLink) {
			throw new Error("Magic link not found");
		}

		if (magicLink.expires_at < new Date().toISOString()) {
			throw new Error("Magic link has expired");
		}

		if (magicLink.used_at) {
			throw new Error("Magic link has already been used");
		}

		const isValidCode = await auth.verifyPassword(code, magicLink.hashed_code);
		if (!isValidCode) {
			throw new Error("Invalid magic link code");
		}

		// If we validate the token and code, then we will set the used_at timestamp
		await magicLink.$query().patch({
			used_at: new Date().toISOString(),
		});

		return { userId: magicLink.user_id };
	}

	async $beforeInsert(queryContext) {
		await super.$beforeInsert(queryContext);
		this.created_at = new Date().toISOString();
		this.updated_at = new Date().toISOString();
	}

	/* This runs updates a timestamp before a record is updated in the database */
	async $beforeUpdate(opt, queryContext) {
		await super.$beforeUpdate(opt, queryContext);
		this.updated_at = new Date().toISOString();
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["user_id", "token", "hashed_code", "expires_at"],
			properties: {
				id: { type: "integer" },
				user_id: { type: "integer" },
				token: { type: "string", minLength: 1, maxLength: 255 },
				hashed_code: { type: "string", minLength: 1, maxLength: 255 },
				used_at: { type: "string", format: "date-time" },
				expires_at: { type: "string", format: "date-time" },
				created_at: { type: "string", format: "date-time", readOnly: true },
				updated_at: { type: "string", format: "date-time" },
			},
		};
	}
}
