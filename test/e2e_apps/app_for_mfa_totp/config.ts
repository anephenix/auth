import { join } from "node:path";

const __dirname = join(
	import.meta.dirname,
	"..",
	"..",
	"..",
	"test",
	"e2e_apps",
	"app_for_mfa_totp",
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
	redis: {
		url: "redis://localhost:6379",
	},
	// Secret for signing cookies, can be a simple string on development, but would be a secure key in production
	cookieSecret: "my-secret",
	totp: {
		serviceName: "MyApp", // Name of the service for TOTP
		// Stored in code for testing convenience, but in real-world scenarios we would load this from an environment variable instead
		totpSecretEncryptionKey:
			"c06585cd5ee081343f2ddd432d09d957163f92a99a395e99e70642058c1a4ff0",
	},
};

export default config;
