import { Model } from "objection";
// We will piggyback off of the util in the other app rather than duplicating it here.
//import auth from "../auth";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;
	email!: string;
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "users";
	}

	async $beforeInsert(queryContext) {
		await super.$beforeInsert(queryContext);
	}

	/* This runs updates a timestamp before a record is updated in the database */
	async $beforeUpdate(opt, queryContext) {
		await super.$beforeUpdate(opt, queryContext);
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
				created_at: {
					type: "string",
					format: "date-time",
					readOnly: true,
				},
				updated_at: { type: "string", format: "date-time" },
			},
		};
	}
}
