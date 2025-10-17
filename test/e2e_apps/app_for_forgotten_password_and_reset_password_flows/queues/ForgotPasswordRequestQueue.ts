import { type Job, Queue } from "@anephenix/job-queue";
import { getClient } from "../redis";

export interface ForgotPasswordRequestJob extends Job {
	data: {
		identifier: string;
		isEmail: boolean;
	};
}

const redis = getClient();
const forgotPasswordRequestQueue = new Queue({
	queueKey: "forgotPasswordRequest",
	redis,
	hooks: {},
});
export default forgotPasswordRequestQueue;
