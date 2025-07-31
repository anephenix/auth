import { join } from "node:path";

const __dirname = join(
	import.meta.dirname,
	"..",
	"..",
	"..",
	"test",
	"e2e_apps",
	"app_with_auth_and_sessions_implemented",
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
			directory: join(__dirname, "migrations"),
		},
	},
	// Secret for signing cookies, can be a simple string on development, but would be a secure key in production
	cookieSecret: "my-secret",
};

export default config;
