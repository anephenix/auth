exports.up = async (knex) => {
	await knex.schema.createTable("sessions", (table) => {
		// NOTE - check if UUIDs are supported in the sqlitedatabase
		// table
		// 	.uuid('id')
		// 	.defaultTo(knex.raw('uuid_generate_v4()'))
		// 	.primary();

		// Fields
		table.increments("id").primary();
		table.integer("user_id").unsigned().notNullable();
		table.string("access_token").notNullable().unique();
		table.string("refresh_token").notNullable().unique();
		table.datetime("access_token_expires_at").notNullable();
		table.datetime("refresh_token_expires_at").notNullable();
		table.string("user_agent");
		table.string("ip_address");
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
	await knex.schema.dropTableIfExists("sessions");
};
