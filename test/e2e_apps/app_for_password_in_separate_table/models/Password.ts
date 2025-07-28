import { Model, type RelationMappings } from "objection";
import db from "../db";
import User from "./User";
import auth from "../auth";

Model.knex(db);

export class Password extends Model {
	id!: number;
	user_id!: number;
	password?: string; // Passed in as a property at insertion, but then encrypted before saving to the database, and wiped afterwards
	hashed_password!: string;
	created_at!: Date;

	static get tableName() {
		return "passwords";
	}

	clearPlaintextPassword() {
		this.password = undefined;
	}

	async $beforeInsert(...args) {
		await super.$beforeInsert(...args);
		if (this.password) {
			// Validate the password using the auth instance
			if (!auth.validatePassword(this.password)) {
				//console.log({ password: this.password });
				throw new Error("Password does not meet validation rules");
			}
			// Hash the password before saving, we'd then store it in a separate table
			// Here's the thing, how do we we create the association between the user and the password record?
			// Perhaps I can pass it via the queryContext?
			// Or maybe it gets called in the afterInsert hook?
			this.hashed_password = await auth.hashPassword(this.password);
			// Clear the plaintext password, as it is not stored in the database table
			this.clearPlaintextPassword();

			// I could be wrong, but I think that using a transaction would guarantee that the user and password records are created together, or not at all.
			// As shown in this example: https://vincit.github.io/objection.js/guide/transactions.html#using-a-transaction
		} else {
			throw new Error("Password is required");
		}
	}

	static get jsonSchema() {
		return {
			type: "object",
			// required: ['user_id', 'hashed_password'], // If you don't comment this out, these throw up validation errors when inserting a new password record via a transaction
			properties: {
				id: { type: "integer" },
				user_id: { type: "integer" },
				hashed_password: { type: "string" },
				created_at: { type: "string", format: "date-time" },
			},
		};
	}

	static get relationMappings(): RelationMappings {
		return {
			user: {
				relation: Model.BelongsToOneRelation,
				modelClass: User,
				join: {
					from: "passwords.user_id",
					to: "users.id",
				},
			},
		};
	}
}

export default Password;
