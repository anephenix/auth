import { Model } from "objection";
import db from "../db";
import auth from "../auth";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;

	// Note - is this needed, and if so, could it be implemented in a wrapper Model?
	// Also, if we needed to store the password as a different fieldName, could we do that?
	password?: string;

	static get tableName() {
		return "users";
	}

	// Note - see if this could be implemented in a wrapper Model
	async $beforeInsert(...args) {
		await super.$beforeInsert(...args);
		if (this.password) {
			// Validate the password using the auth instance
			if (!auth.validatePassword(this.password)) {
				console.log({ password: this.password });
				throw new Error("Password does not meet validation rules");
			}
			// Hash the password before saving, we'd then store it in a separate table
			// Here's the thing, how do we we create the association between the user and the password record?
			// Perhaps I can pass it via the queryContext?
			// Or maybe it gets called in the afterInsert hook?
			//const hashedPassword = await auth.hashPassword(this.password);
			this.password = undefined; // Clear the plaintext password, as it is not stored in the users table
		} else {
			throw new Error("Password is required");
		}
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["username"],
			properties: {
				id: { type: "integer" },
				username: { type: "string", minLength: 1, maxLength: 255 },
			},
		};
	}
}

// Question - I wonder if... I should offer a ModelWrapper for easier usage of the auth instance?

export default User;
