import knex from "knex";
import config from "./config";

const knexInstance = knex(config.db);

export default knexInstance;
