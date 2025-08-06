import type { Job } from "@anephenix/job-queue";

export interface SmsCodeQueueJob extends Job {
	name: "sendSmsCode";
	data: {
		mobile_number: string; // The email address to send the magic link to
		code: string; // The code to be used for verification
	};
}
