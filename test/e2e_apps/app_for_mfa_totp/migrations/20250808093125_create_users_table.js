exports.up = async (knex) => {
	await knex.schema.createTable("users", (table) => {
		table.increments("id").primary();
		table.string("username").notNullable().unique();
		table.string("email").notNullable().unique();
		table.string("mobile_number").notNullable().unique(); // Added for MFA SMS code
		table.string("mfa_totp_secret");
		table.string("hashed_password").notNullable();
		table.timestamps(true, true);
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists("users");
};
