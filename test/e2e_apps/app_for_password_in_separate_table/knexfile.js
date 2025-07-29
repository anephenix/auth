/*
    Notes

    - I have to create a knexfile.js in order to run knex migrate:latest
    - I tried to run it with ts, but it didn't work
    - Annoyingly I couldn't get it to load the config from another file, so I had to duplicate the config here
    - Also, it seems to want the config to be scoped by environment by default, so I had to wrap it in an object here

    - I think I will later try to resolve this - but for now this works

    - In a nutshell, typescript support in knex isn't smooth sailing
*/

const config = {
	client: "sqlite3",
	connection: {
		filename: "./database.sqlite", // TODO - might need to resolve this path using process.cwd() and path.join
	},
	useNullAsDefault: true,
	pool: {
		min: 0,
		max: 10,
	},
};

module.exports = { development: config };
