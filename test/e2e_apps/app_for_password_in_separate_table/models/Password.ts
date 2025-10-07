import { ObjectionRelation } from "@anephenix/objection-relations";
import { Model, type QueryContext, type RelationMappings } from "objection";
import auth from "../auth";
import db from "../db";
import { User } from "./User";

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

	async $beforeInsert(queryContext: QueryContext) {
		await super.$beforeInsert(queryContext);
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
		const or = new ObjectionRelation({
			subject: "Password",
			modelPath: __dirname,
		});

		return { user: or.belongsTo(User) };
	}
}

export default Password;
