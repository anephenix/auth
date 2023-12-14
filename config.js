const config = {
	port: 3000,
	redis: {
		db: 0,
	},
	db: {
		client: 'postgresql',
		connection: {
			host: process.env.PG_HOST || 'localhost',
			user: process.env.PGUSER || 'postgres',
			database: 'auth_api_development',
			password: process.env.PG_PASSWORD,
			port: parseInt(process.env.PGPORT) || 5432,
		},
		migrations: {
			tableName: 'knex_migrations',
		},
	},
};

module.exports = config;
