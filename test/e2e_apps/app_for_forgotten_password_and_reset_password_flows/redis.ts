// Dependencies
import { createClient, type RedisClientType } from "redis";
import config from "./config";

let redisClient: RedisClientType | null = null;

const getClient = () => {
	if (!redisClient) {
		redisClient = createClient(config.redis);
	}
	return redisClient;
};

export { getClient };
