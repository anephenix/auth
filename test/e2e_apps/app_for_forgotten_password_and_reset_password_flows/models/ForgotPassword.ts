import { Model, type QueryContext } from "objection";
import auth from "../auth";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class ForgotPassword extends Model {
	id!: number;
	user_id!: number;
	token?: string;
	token_hash!: string;
	expires_at!: Date;
	used_at?: Date;
	created_at!: Date;
	updated_at!: Date;

	static get tableName() {
		return "forgot_passwords";
	}

	async $beforeInsert(queryContext: QueryContext) {
		await super.$beforeInsert(queryContext);

		// If there is no token, we cannot proceed
		if (!this.token) {
			throw new Error("Token is required");
		}

		// We store a hashed version of the token in the database
		this.token_hash = await auth.hashPassword(this.token);
		// We unset the plaintext token so that it is not saved in the database
		this.token = undefined;

		// We set the expiry time for the token (e.g. 5 minutes from now)
		this.expires_at = new Date(Date.now() + 5 * 60 * 1000);

		// We set the timestamps
		const now = new Date();
		this.created_at = now;
		this.updated_at = now;
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["user_id"],
			properties: {
				id: { type: "integer" },
				user_id: { type: "integer" },
				token_hash: { type: "string", minLength: 1, maxLength: 255 },
				expires_at: { type: "string", format: "date-time" },
				used_at: { type: ["string", "null"], format: "date-time" },
				created_at: { type: "string", format: "date-time" },
				updated_at: { type: "string", format: "date-time" },
			},
		};
	}
}

export default ForgotPassword;
