import { Model } from "objection";
// We will piggyback off of the util in the other app rather than duplicating it here.
import { isEmail } from "../../../utils/comparators";
import auth from "../auth";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;
	password?: string;
	hashed_password!: string;

	static get tableName() {
		return "users";
	}

	clearPlaintextPassword() {
		this.password = undefined;
	}

	async $beforeInsert(queryContext) {
		await super.$beforeInsert(queryContext);
		if (this.username) this.username = auth.normalize(this.username);
		if (this.password) {
			if (!auth.validatePassword(this.password)) {
				throw new Error("Password does not meet validation rules");
			}
			this.hashed_password = await auth.hashPassword(this.password);
			this.clearPlaintextPassword();
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

	// This is an implementation of the User.authenticate method, used previously in a different project.
	static async authenticate(payload) {
		const { identifier, password } = payload;
		const normalizedIdentifier = auth.normalize(identifier ? identifier : "");
		const params = {};
		const key = isEmail(normalizedIdentifier) ? "email" : "username";
		params[key] = normalizedIdentifier;
		const user = await User.query().where(params).limit(1).first();
		if (!user) throw new Error("User not found");
		const isAuthenticated = await auth.verifyPassword(
			password,
			user.hashed_password,
		);
		if (isAuthenticated) {
			return {
				id: user.id,
				username: user.username,
			};
		} else {
			throw new Error("Password incorrect");
		}
	}
}

export default User;
