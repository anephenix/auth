import { Model, type RelationMappings } from "objection";
import auth from "../auth";
import db from "../db";
import Password from "./Password";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;

	static get tableName() {
		return "users";
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

	static get relationMappings(): RelationMappings {
		return {
			passwords: {
				relation: Model.HasManyRelation,
				modelClass: Password,
				join: {
					from: "users.id",
					to: "passwords.user_id",
				},
			},
		};
	}

	// This is an implementation of the User.authenticate method, used previously in a different project.
	static async authenticate(payload) {
		const { identifier, password } = payload;
		const params = {};
		const key = identifier.match("@") ? "email" : "username";
		params[key] = identifier;
		const user = await this.query().where(params).limit(1).first();
		if (!user) throw new Error("User not found");
		const passwordRecord = (await user
			.$relatedQuery("passwords")
			.orderBy("created_at", "desc")
			.limit(1)
			.first()) as Password;
		if (!passwordRecord) throw new Error("Password not found for user");
		const isAuthenticated = await auth.verifyPassword(
			password,
			passwordRecord.hashed_password,
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

// Question - I wonder if... I should offer a ModelWrapper for easier usage of the auth instance?

export default User;
