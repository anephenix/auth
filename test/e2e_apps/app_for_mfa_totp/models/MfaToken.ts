import { Model } from "objection";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class MfaToken extends Model {
	id!: number;

	// Fields to add?  - user_id, token, expires_at, used_at, number_of_attempts

	user_id!: number; // Foreign key to the User model
	token!: string; // The TOTP token
	expires_at!: string; // Expiration time for the token
	used_at?: string; // Time when the token was used, if applicable
	number_of_attempts!: number; // Number of attempts made with this token
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "mfa_tokens";
	}

	async $beforeInsert(queryContext) {
		await super.$beforeInsert(queryContext);
		/* This runs sets timestamps before a record is inserted into the database */
		const date = new Date().toISOString();
		this.created_at = date;
		this.updated_at = date;
	}

	/* This runs updates a timestamp before a record is updated in the database */
	async $beforeUpdate(opt, queryContext) {
		await super.$beforeUpdate(opt, queryContext);
		this.updated_at = new Date().toISOString();
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["user_id", "token", "expires_at"],
			properties: {
				id: { type: "integer" },
				user_id: { type: "integer" },
				token: { type: "string" },
				expires_at: { type: "string", format: "date-time" },
				used_at: { type: "string", format: "date-time" },
				number_of_attempts: { type: "integer" },
				created_at: {
					type: "string",
					format: "date-time",
					readOnly: true,
				},
				updated_at: { type: "string", format: "date-time" },
			},
		};
	}
}
