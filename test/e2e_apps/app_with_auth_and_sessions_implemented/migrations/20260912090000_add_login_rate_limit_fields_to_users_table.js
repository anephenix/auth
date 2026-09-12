exports.up = async (knex) => {
	await knex.schema.alterTable("users", (table) => {
		table.integer("failed_login_attempts").notNullable().defaultTo(0);
		table.timestamp("failed_login_window_started_at").nullable();
	});
};

exports.down = async (knex) => {
	await knex.schema.alterTable("users", (table) => {
		table.dropColumn("failed_login_attempts");
		table.dropColumn("failed_login_window_started_at");
	});
};
