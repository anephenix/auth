import { type Job, Queue } from "@anephenix/job-queue";
import { getClient } from "../redis";

export interface EmailJob extends Job {
	data: {
		to: string;
		selector: string;
		token: string;
	};
}

const redis = getClient();
const emailQueue = new Queue({ queueKey: "email", redis, hooks: {} });
export default emailQueue;
