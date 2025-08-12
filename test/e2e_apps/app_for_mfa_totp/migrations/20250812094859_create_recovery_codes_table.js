exports.up = async (knex) => {
	await knex.schema.createTable("recovery_codes", (table) => {
		// Fields
		table.increments("id").primary();
		table.integer("user_id").unsigned().notNullable();
		table.string("hashed_code").notNullable().unique();
		table.datetime("used_at");
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
	await knex.schema.dropTableIfExists("recovery_codes");
};
