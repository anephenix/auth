const config = {
	db: {
		client: "sqlite3",
		connection: {
			filename: "./database.sqlite",
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
