import { Queue } from "@anephenix/job-queue";
import { getClient } from "../redis";

const redis = getClient();
const smsCodeQueue = new Queue({ queueKey: "sms", redis, hooks: {} });

export default smsCodeQueue;
