import { Model, type RelationMappings } from "objection";
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
}

// Question - I wonder if... I should offer a ModelWrapper for easier usage of the auth instance?

export default User;
