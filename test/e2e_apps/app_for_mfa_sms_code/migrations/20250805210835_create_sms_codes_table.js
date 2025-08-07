exports.up = async (knex) => {
	await knex.schema.createTable("sms_codes", (table) => {
		// Fields
		table.increments("id").primary();
		table.integer("user_id").unsigned().notNullable();
		table.string("token").notNullable().unique();
		table.string("hashed_code").notNullable().unique();
		table.datetime("used_at");
		table.datetime("expires_at").notNullable();
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
	await knex.schema.dropTableIfExists("sms_codes");
};
