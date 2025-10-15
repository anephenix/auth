import { Queue } from "@anephenix/job-queue";
import { getClient } from "../redis";

const redis = getClient();
const forgotPasswordRequestQueue = new Queue({
	queueKey: "forgotPasswordRequest",
	redis,
	hooks: {},
});
export default forgotPasswordRequestQueue;
