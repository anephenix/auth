exports.up = (knex) =>
	knex.schema.createTable("passwords", (table) => {
		table.increments("id").primary();
		table.integer("user_id").unsigned().notNullable();
		table.string("hashed_password").notNullable();
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table
			.foreign("user_id")
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
	});

exports.down = (knex) => knex.schema.dropTableIfExists("passwords");
