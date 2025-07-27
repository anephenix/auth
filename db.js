// Dependencies
const config = require("./config");
const bluebird = require("bluebird");
const knex = require("knex");

const redisLib = require("redis");
bluebird.promisifyAll(redisLib.RedisClient.prototype);
bluebird.promisifyAll(redisLib.Multi.prototype);
const redis = redisLib.createClient(config.redis);
const db = knex(config.db);
module.exports = {
	redis,
	db,
};
