import { Model } from "objection";
import auth from "../auth";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class RecoveryCode extends Model {
	id!: number;
	user_id!: number;
	code?: string; // The recovery code, before it gets hashed
	hashed_code!: string;
	used_at?: string; // Time when the code was used, if applicable
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "recovery_codes";
	}

	clearPlaintextCode() {
		this.code = undefined;
	}

	async $beforeInsert(queryContext) {
		await super.$beforeInsert(queryContext);

		if (this.code) {
			this.hashed_code = await auth.hashPassword(this.code);
			this.clearPlaintextCode();

			/* This runs sets timestamps before a record is inserted into the database */
			const date = new Date().toISOString();
			this.created_at = date;
			this.updated_at = date;
		} else {
			throw new Error("Code is required");
		}
	}

	/* This runs updates a timestamp before a record is updated in the database */
	async $beforeUpdate(opt, queryContext) {
		await super.$beforeUpdate(opt, queryContext);
		this.updated_at = new Date().toISOString();
	}

	static async generateCodes() {
		const codes: string[] = [];
		for (let i = 0; i < 10; i++) {
			const code = auth.tokenGenerator();
			codes.push(code);
		}
		return codes;
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["user_id", "hashed_code"],
			properties: {
				id: { type: "integer" },
				user_id: { type: "integer" },
				hashed_code: { type: "string" },
				used_at: { type: "string", format: "date-time" },
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
