exports.up = async (knex) => {
	await knex.schema.createTable("users", (table) => {
		table.increments("id").primary();
		table.string("username").notNullable().unique();
		table.string("hashed_password").notNullable();
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists("users");
};
