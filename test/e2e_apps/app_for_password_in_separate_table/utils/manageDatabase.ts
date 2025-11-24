import fs from "node:fs";
import type { Knex } from "knex";
import knex from "knex";

export const removeDatabaseFileIfExists = async (dbPath: string) => {
	if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
};

export const runMigrations = async (config: Knex.Config) => {
	await knex(config).migrate.latest();
};
