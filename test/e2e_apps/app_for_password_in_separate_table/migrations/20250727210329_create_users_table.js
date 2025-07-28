exports.up = async (knex) => {
	await knex.schema.createTable("users", (table) => {
		table.increments("id").primary();
		table.string("username").notNullable().unique();
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists("users");
};
