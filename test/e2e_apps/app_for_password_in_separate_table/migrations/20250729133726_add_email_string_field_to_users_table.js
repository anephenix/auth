exports.up = async (knex) => {
	await knex.schema.alterTable("users", (table) => {
		table.string("email");
	});
};

exports.down = async (knex) => {
	await knex.schema.alterTable("users", (table) => {
		table.dropColumn("email");
	});
};
