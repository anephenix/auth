import fs from "node:fs";
import knex from "knex";

export const removeDatabaseFileIfExists = async (dbPath) => {
	if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
};

export const runMigrations = async (config) => {
	await knex(config).migrate.latest();
};
