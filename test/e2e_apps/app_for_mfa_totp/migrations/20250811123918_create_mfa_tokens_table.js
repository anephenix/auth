exports.up = async (knex) => {
	await knex.schema.createTable("mfa_tokens", (table) => {
		// Fields
		table.increments("id").primary();
		table.integer("user_id").unsigned().notNullable();
		table.string("token").notNullable().unique();
		table.datetime("expires_at").notNullable();
		table.datetime("used_at");
		table.integer("number_of_attempts").notNullable().defaultTo(0);
		table.timestamps(true, true);
		// Constraints
		table
			.foreign("user_id")
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists("mfa_tokens");
};
