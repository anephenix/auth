exports.up = async (knex) => {
	await knex.schema.createTable("users", (table) => {
		table.increments("id").primary();
		table.string("username").notNullable().unique();
		table.string("email").notNullable().unique();
		table.timestamps(true, true);
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists("users");
};
