/*
    Notes

    Copied from the other app to save time.

*/

const config = {
	client: "sqlite3",
	connection: {
		filename: "./database.sqlite",
	},
	useNullAsDefault: true,
	pool: {
		min: 0,
		max: 10,
	},
};

module.exports = { development: config };
