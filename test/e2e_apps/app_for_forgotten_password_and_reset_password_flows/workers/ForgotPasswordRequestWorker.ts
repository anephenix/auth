import { Worker } from "@anephenix/job-queue";
import auth from "../auth";
import ForgotPassword from "../models/ForgotPassword";
import User from "../models/User";
import emailQueue from "../queues/EmailQueue";
import forgotPasswordRequestQueue, {
	type ForgotPasswordRequestJob,
} from "../queues/ForgotPasswordRequestQueue";

class ForgotPasswordRequestWorker extends Worker {
	async processJob(job: ForgotPasswordRequestJob) {
		this.status = "processing";
		try {
			const { identifier, isEmail } = job.data;
			const key = isEmail ? "email" : "username";
			const user = await User.query().where(key, identifier).first();
			// User exists, create a forgotPassword record and send email
			if (user) {
				const token = auth.tokenGenerator();
				const forgotPasswordRecord = await ForgotPassword.query().insert({
					token,
					user_id: user.id,
				});
				emailQueue.add({
					name: "send-forgot-password-email",
					data: {
						to: user.email,
						selector: forgotPasswordRecord.selector,
						token,
					},
				});
			}
			await this.completeJob(job);
		} catch {
			await this.failJob(job);
		}
		return;
	}
}

const forgotPasswordRequestWorker = new ForgotPasswordRequestWorker(
	forgotPasswordRequestQueue,
);

export default forgotPasswordRequestWorker;
