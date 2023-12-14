/* Dependencies */
const { Client } = require('pg');
const { db } = require('../config');
const client = new Client();

/*
        This script will create a PostgreSQL database, and install an extension that
        generates UUIDs for using as primary keys in database tables.
        We use UUIDs over integers as the Primary Key for sensitive tables like users
        and organisations. For non-sensitive tables, we opt for integers as the PK.
*/

const main = async () => {
	await client.connect();
	await client.query(`CREATE DATABASE ${db.connection.database}`);
	await client.end();
	console.log(`Creating database ${db.connection.database}`);

	process.env.PGDATABASE = db.connection.database;

	const nextClient = new Client();
	await nextClient.connect();
	await nextClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
	await nextClient.end();
	process.env.PGDATABASE = null;
};

main();

/* NOTE - not yet tested, and I think that there is a more modern version somewhere else */
