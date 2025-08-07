import { Model } from "objection";
import auth from "../auth";
import db from "../db";
import { User } from "./User";

// Attach the knex connection instance to the Model
Model.knex(db);

export class SmsCode extends Model {
	id!: number;
	user_id!: number;
	token!: string; // Token for secure verification
	hashed_code!: string;
	used_at?: string; // Timestamp when the code was used
	expires_at!: string;
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "sms_codes";
	}
	async $beforeInsert(queryContext) {
		await super.$beforeInsert(queryContext);
		const date = new Date().toISOString();
		this.created_at = date;
		this.updated_at = date;
	}
	async $beforeUpdate(opt, queryContext) {
		await super.$beforeUpdate(opt, queryContext);
		this.updated_at = new Date().toISOString();
	}

	/* Checks if the SMS code is expired based on the expiration date */
	codeHasExpired() {
		const now = new Date();
		return new Date(this.expires_at) < now;
	}

	verifyCode = async (code: string): Promise<boolean> => {
		const isValid = await auth.verifyPassword(code, this.hashed_code);
		return isValid;
	};

	static get jsonSchema() {
		return {
			type: "object",
			required: ["hashed_code", "expires_at"],
			properties: {
				id: { type: "integer" },
				user_id: { type: "integer" },
				token: { type: "string" },
				hashed_code: { type: "string" },
				used_at: { type: "string", format: "date-time" },
				expires_at: { type: "string", format: "date-time" },
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
					from: "sms_codes.user_id",
					to: "users.id",
				},
			},
		};
	}
}
