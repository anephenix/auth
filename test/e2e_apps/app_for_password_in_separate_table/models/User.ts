import { Model, type RelationMappings } from "objection";
import { isEmail } from "../../../utils/comparators";
import auth from "../auth";
import db from "../db";
import Password from "./Password";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;
	email?: string;

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
		const normalizedIdentifier = auth.normalize(identifier ? identifier : "");
		const params = {};
		const key = isEmail(normalizedIdentifier) ? "email" : "username";
		params[key] = normalizedIdentifier;
		const user = await User.query().where(params).limit(1).first();
		if (!user) throw new Error("User not found");
		/* 
			I discovered that the created_at field's timestamps are accurate to the second,
			which means that we cannot reliably use them in a unit test to determine the most recent password.

			Therefore, because the id is a numerical auto-incrementing field,
			I will use the most recent password by ordering by id in descending order.

			In reality, we'd need to use a more precise timestamp (to the millisecond or nanosecond) to help pass the unit tests
		*/
		const passwordRecord = (await user
			.$relatedQuery("passwords")
			.orderBy("id", "desc")
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
