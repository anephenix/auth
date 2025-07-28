import { join } from "node:path";

const __dirname = join(
	import.meta.dirname,
	"..",
	"..",
	"..",
	"test",
	"e2e_apps",
	"app_for_password_in_separate_table",
);
const dbFilePath = join(__dirname, "database.sqlite");

const config = {
	db: {
		client: "sqlite3",
		connection: {
			filename: dbFilePath,
		},
		useNullAsDefault: true,
		pool: {
			min: 0,
			max: 10,
		},
		migrations: {
			extension: "ts",
		},
	},
};

export default config;
