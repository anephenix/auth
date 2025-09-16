import { Model, type ModelOptions, type QueryContext } from "objection";
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

	/*
		Verifies a recovery code 
		
		- if the code is valid, it marks it as used and returns true
		- if the code is used, it increments the number_of_attempts and returns false
	*/
	async verify(code: string): Promise<boolean> {
		if (!this.hashed_code) return false;
		const result = await auth.verifyPassword(code, this.hashed_code);
		// Mark the recovery code as used if verification is successful
		if (result) {
			await this.markAsUsed();
		} else {
			await this.incrementAttempts();
		}
		return result;
	}

	/* Increments the number of attempts for this recovery code */
	async incrementAttempts() {
		await this.$query().increment("number_of_attempts", 1);
	}

	/* Marks the recovery code as used so we know not to use it again */
	async markAsUsed() {
		const used_at = new Date().toISOString();
		await this.$query().patch({ used_at });
	}

	async $beforeInsert(queryContext: QueryContext) {
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
	async $beforeUpdate(opt: ModelOptions, queryContext: QueryContext) {
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
			required: ["user_id"],
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
