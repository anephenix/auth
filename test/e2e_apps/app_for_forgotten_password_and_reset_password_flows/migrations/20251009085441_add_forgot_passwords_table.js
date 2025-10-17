exports.up = async (knex) => {
	await knex.schema.createTable("forgot_passwords", (table) => {
		table.increments("id").primary();
		table
			.integer("user_id")
			.notNullable()
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		table.string("selector").notNullable().unique();
		table.string("token_hash").notNullable().unique();
		table.timestamp("expires_at").notNullable();
		table.timestamp("used_at");
		table.timestamp("created_at");
		table.timestamp("updated_at");
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists("forgot_passwords");
};
