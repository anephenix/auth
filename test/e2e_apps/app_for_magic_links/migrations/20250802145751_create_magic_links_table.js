exports.up = async (knex) => {
	await knex.schema.createTable("magic_links", (table) => {
		table.increments("id").primary();
		table.integer("user_id").notNullable(); // you can add a .references() if users table exists
		table.string("token").notNullable();
		table.string("hashed_code").notNullable();
		table.dateTime("expires_at").notNullable();
		table.dateTime("used_at").nullable();
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
	await knex.schema.dropTableIfExists("magic_links");
};
