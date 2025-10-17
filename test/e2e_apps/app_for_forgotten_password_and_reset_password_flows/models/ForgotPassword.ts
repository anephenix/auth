import { Model, type QueryContext } from "objection";
import auth from "../auth";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class ForgotPassword extends Model {
	id!: number;
	user_id!: number;
	selector!: string;
	token?: string;
	token_hash!: string;
	expires_at!: Date;
	/*
		There is an odd inconsistency here - the other date fields do not get 
		validate called on them, therefore they get set as Date objects.

		However, used_at does get validate called on it, therefore it gets 
		set as a string.

		This inconsistency is due to how Objection.js handles validation 
		and type coercion.
	*/
	used_at?: Date | string | null;
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
		this.selector = auth.codeGenerator();
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

	async markAsUsed() {
		await this.$query().patch({ used_at: new Date().toISOString() });
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["user_id"],
			properties: {
				id: { type: "integer" },
				user_id: { type: "integer" },
				selector: { type: "string", minLength: 1, maxLength: 255 },
				token_hash: { type: "string", minLength: 1, maxLength: 255 },
				expires_at: { type: "string", format: "date-time" },
				used_at: { type: "string", format: "date-time" },
				created_at: { type: "string", format: "date-time" },
				updated_at: { type: "string", format: "date-time" },
			},
		};
	}
}

export default ForgotPassword;
