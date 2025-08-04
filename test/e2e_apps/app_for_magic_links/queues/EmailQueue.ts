import { Queue } from "@anephenix/job-queue";
import { getClient } from "../redis";

const redis = getClient();
const emailQueue = new Queue({ queueKey: "email", redis, hooks: {} });

export default emailQueue;
