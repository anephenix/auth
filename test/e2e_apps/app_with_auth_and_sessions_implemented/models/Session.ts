import { Model, type ModelOptions, type QueryContext } from "objection";
import auth from "../auth";
import db from "../db";
import { User } from "./User";

// Attach the knex connection instance to the Model
Model.knex(db);

export class Session extends Model {
	id!: number;
	user_id!: number;
	access_token!: string;
	refresh_token!: string;
	access_token_expires_at!: string;
	refresh_token_expires_at!: string;
	user_agent?: string;
	ip_address?: string;
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "sessions";
	}

	/* Generates the access and refresh tokens for the session, as well as their expiration datetimes */
	static generateTokens() {
		const {
			accessToken,
			accessTokenExpiresAt,
			refreshToken,
			refreshTokenExpiresAt,
		} = auth.generateSession();
		return {
			access_token: accessToken,
			access_token_expires_at: accessTokenExpiresAt.toISOString(),
			refresh_token: refreshToken,
			refresh_token_expires_at: refreshTokenExpiresAt.toISOString(),
		};
	}

	async $beforeInsert(queryContext: QueryContext) {
		await super.$beforeInsert(queryContext);
		const date = new Date().toISOString();
		this.created_at = date;
		this.updated_at = date;
	}

	/* This runs updates a timestamp before a record is updated in the database */
	async $beforeUpdate(opt: ModelOptions, queryContext: QueryContext) {
		await super.$beforeUpdate(opt, queryContext);
		this.updated_at = new Date().toISOString();
	}
	/* Checks if the session is expired based on the access token expiration dates */
	accessTokenHasExpired() {
		const now = new Date();
		return new Date(this.access_token_expires_at) < now;
	}

	refreshTokenHasExpired() {
		const now = new Date();
		return new Date(this.refresh_token_expires_at) < now;
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: [
				"user_id",
				"access_token",
				"refresh_token",
				"access_token_expires_at",
				"refresh_token_expires_at",
			],
			properties: {
				id: { type: "integer" },
				user_id: { type: "integer" },
				access_token: { type: "string" },
				refresh_token: { type: "string" },
				access_token_expires_at: { type: "string", format: "date-time" },
				refresh_token_expires_at: { type: "string", format: "date-time" },
				user_agent: { type: "string" },
				ip_address: { type: "string" },
				created_at: { type: "string", format: "date-time" },
				updated_at: { type: "string", format: "date-time" },
			},
		};
	}

	static get relationMappings() {
		return {
			user: {
				relation: Model.BelongsToOneRelation,
				modelClass: User,
				join: {
					from: "sessions.user_id",
					to: "users.id",
				},
			},
		};
	}
}
