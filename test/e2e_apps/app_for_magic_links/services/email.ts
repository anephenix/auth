import emailQueue from "../queues/EmailQueue";

const emailService = {
	sendMagicLinkEmail: async ({ to, token, code, tokenExpiresAt }) => {
		const job = {
			name: "sendMagicLinkEmail",
			data: {
				to,
				token,
				code,
				tokenExpiresAt,
			},
		};
		return await emailQueue.add(job);
	},
};

export default emailService;
