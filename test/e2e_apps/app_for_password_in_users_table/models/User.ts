import { Model, type QueryContext } from "objection";
import { isEmail } from "../../../utils/comparators";
import auth from "../auth";
import db from "../db";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;
	password?: string;
	hashed_password!: string;
	failed_login_attempts!: number;
	failed_login_window_started_at?: string | null;

	static get tableName() {
		return "users";
	}

	clearPlaintextPassword() {
		this.password = undefined;
	}

	async $beforeInsert(queryContext: QueryContext) {
		await super.$beforeInsert(queryContext);
		if (this.username) this.username = auth.normalize(this.username);
		if (this.password) {
			if (!auth.validatePassword(this.password)) {
				throw new Error("Password does not meet validation rules");
			}
			this.hashed_password = await auth.hashPassword(this.password);
			this.clearPlaintextPassword();
		} else {
			throw new Error("Password is required");
		}
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["username"],
			properties: {
				id: { type: "integer" },
				username: { type: "string", minLength: 1, maxLength: 255 },
			},
		};
	}

	// This is an implementation of the User.authenticate method, used previously in a different project.
	static async authenticate(payload: Record<string, string>) {
		const { identifier, password } = payload;
		const normalizedIdentifier = auth.normalize(identifier ? identifier : "");
		const params: Record<string, string> = {};
		const key = isEmail(normalizedIdentifier) ? "email" : "username";
		params[key] = normalizedIdentifier;
		const user = await User.query().where(params).limit(1).first();

		/*
			The rate limit window resets once it has expired, so we work out
			up front whether the stored attempt count is still relevant.
		*/
		const windowExpired =
			!user?.failed_login_window_started_at ||
			Date.now() - new Date(user.failed_login_window_started_at).getTime() >=
				auth.loginWindowSeconds * 1000;

		if (user && !windowExpired) {
			const rateLimitStatus = auth.checkRateLimit({
				attempts: user.failed_login_attempts,
				firstAttemptAt: user.failed_login_window_started_at as string,
			});
			if (rateLimitStatus.blocked) {
				throw new Error(
					`Too many login attempts. Please try again in ${rateLimitStatus.retryAfter} seconds.`,
				);
			}
		}

		const isAuthenticated = await auth.verifyPasswordSafe(
			password,
			user?.hashed_password,
		);

		if (isAuthenticated && user) {
			if (user.failed_login_attempts > 0) {
				await user.$query().patch({
					failed_login_attempts: 0,
					failed_login_window_started_at: null,
				});
			}
			return {
				id: user.id,
				username: user.username,
			};
		}

		if (user) {
			await user.$query().patch({
				failed_login_attempts: windowExpired
					? 1
					: user.failed_login_attempts + 1,
				failed_login_window_started_at: windowExpired
					? new Date().toISOString()
					: user.failed_login_window_started_at,
			});
		}

		throw new Error("Invalid credentials");
	}
}

export default User;
