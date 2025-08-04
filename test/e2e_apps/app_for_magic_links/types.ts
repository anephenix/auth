import type { Job } from "@anephenix/job-queue";

export interface SendMagicLinkEmailJob extends Job {
	name: "send_magic_link_email";
	data: {
		to: string; // The email address to send the magic link to
		token: string; // The token to be included in the magic link
		code: string; // The code to be used for verification
		tokenExpiresAt: Date; // The expiration date of the token
	};
}
