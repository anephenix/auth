import { Model } from "objection";
import { isEmail } from "../../../utils/comparators";
import auth from "../auth";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;
	email!: string;
	password?: string;
	hashed_password!: string;
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "users";
	}

	clearPlaintextPassword() {
		this.password = undefined;
	}

	async $beforeInsert(queryContext) {
		await super.$beforeInsert(queryContext);
		if (this.username) this.username = auth.normalize(this.username);
		if (this.email) this.email = auth.normalize(this.email);
		if (this.password) {
			if (!auth.validatePassword(this.password)) {
				throw new Error("Password does not meet validation rules");
			}
			this.hashed_password = await auth.hashPassword(this.password);
			this.clearPlaintextPassword();

			/* This runs sets timestamps before a record is inserted into the database */
			const date = new Date().toISOString();
			this.created_at = date;
			this.updated_at = date;
		} else {
			throw new Error("Password is required");
		}
	}

	/* This runs updates a timestamp before a record is updated in the database */
	async $beforeUpdate(opt, queryContext) {
		await super.$beforeUpdate(opt, queryContext);
		if (this.username) this.username = auth.normalize(this.username);
		if (this.email) this.email = auth.normalize(this.email);
		this.updated_at = new Date().toISOString();
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["username", "email"],
			properties: {
				id: { type: "integer" },
				username: {
					type: "string",
					minLength: 2,
					maxLength: 64,
					pattern: String.raw`^([\w\d]){1,255}$`,
				},
				email: {
					type: "string",
					format: "email",
					pattern: String.raw`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`,
					minLength: 1,
					maxLength: 255,
				},
				hashed_password: {
					type: "string",
					minLength: 10,
					maxLength: 255,
					writeOnly: true,
				},
				created_at: {
					type: "string",
					format: "date-time",
					readOnly: true,
				},
				updated_at: { type: "string", format: "date-time" },
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
