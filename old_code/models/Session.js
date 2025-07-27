const { redis } = require("../db");
const { v4: uuidv4 } = require("uuid");

const model = {
	// Create a record
	create: (payload) => {
		const id = uuidv4();
		const sessionId = `session_${id}`;
		redis.setAsync(sessionId, JSON.stringify(payload));
		return id;
	},

	// Find a record based on a key being provided
	get: async (id) => {
		const sessionId = `session_${id}`;
		const session = JSON.parse(await redis.getAsync(sessionId));
		return session;
	},

	// Update a record
	set: (id, payload) => {
		const sessionId = `session_${id}`;
		return redis.setAsync(sessionId, JSON.stringify(payload));
	},

	// Remove a record based on an id
	delete: (id) => {
		const sessionId = `session_${id}`;
		return redis.delAsync(sessionId);
	},

	flush: async () => {
		const sessionIds = await redis.keysAsync("session_*");
		for await (const sessionId of sessionIds) {
			await redis.delAsync(sessionId);
		}
		return;
	},
};

module.exports = model;
