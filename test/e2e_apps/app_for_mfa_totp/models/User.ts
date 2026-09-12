import { Model, type ModelOptions, type QueryContext } from "objection";
import { isEmail } from "../../../utils/comparators";
import auth from "../auth";
import db from "../db";
import { RecoveryCode } from "./RecoveryCode";
import { Session } from "./Session";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;
	email!: string;
	mobile_number!: string;
	password?: string;
	hashed_password!: string;
	mfa_totp_secret?: string; // Field to store the encrypted TOTP secret
	failed_login_attempts!: number;
	failed_login_window_started_at?: string | null;
	created_at!: string;
	updated_at!: string;

	static get tableName() {
		return "users";
	}

	clearPlaintextPassword() {
		this.password = undefined;
	}

	isUsingMFA() {
		return !!this.mfa_totp_secret;
	}

	async $beforeInsert(queryContext: QueryContext) {
		await super.$beforeInsert(queryContext);
		if (this.username) this.username = auth.normalize(this.username);
		if (this.email) this.email = auth.normalize(this.email);

		if (this.password) {
			if (!auth.validatePassword(this.password)) {
				throw new Error("Password does not meet validation rules");
			}
			this.hashed_password = await auth.hashPassword(this.password);
			this.clearPlaintextPassword();

			/* This runs sets timestamps before a record is inserted into the database */
			const date = new Date().toISOString();
			this.created_at = date;
			this.updated_at = date;
		} else {
			throw new Error("Password is required");
		}
	}

	/* This runs updates a timestamp before a record is updated in the database */
	async $beforeUpdate(opt: ModelOptions, queryContext: QueryContext) {
		await super.$beforeUpdate(opt, queryContext);
		if (this.username) this.username = auth.normalize(this.username);
		if (this.email) this.email = auth.normalize(this.email);
		this.updated_at = new Date().toISOString();
	}

	static get jsonSchema() {
		return {
			type: "object",
			required: ["username", "email", "mobile_number"],
			properties: {
				id: { type: "integer" },
				username: {
					type: "string",
					minLength: 2,
					maxLength: 64,
					pattern: String.raw`^([\w\d]){1,255}$`,
				},
				email: {
					type: "string",
					format: "email",
					pattern: String.raw`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`,
					minLength: 1,
					maxLength: 255,
				},
				mobile_number: {
					type: "string",
					minLength: 10,
					maxLength: 15,
					pattern: String.raw`^\+?[0-9\s]+$`, // Basic pattern for international phone numbers
				},
				mfa_totp_secret: {
					type: ["string", "null"], // Can be a string or null if MFA is disabled
					minLength: 1,
					maxLength: 255,
					writeOnly: true,
				},
				hashed_password: {
					type: "string",
					minLength: 10,
					maxLength: 255,
					writeOnly: true,
				},
				failed_login_attempts: { type: "integer", writeOnly: true },
				failed_login_window_started_at: {
					type: ["string", "null"],
					format: "date-time",
					writeOnly: true,
				},
				created_at: {
					type: "string",
					format: "date-time",
					readOnly: true,
				},
				updated_at: { type: "string", format: "date-time" },
			},
		};
	}

	// This is an implementation of the User.authenticate method, used previously in a different project.
	static async authenticate(payload: { identifier: string; password: string }) {
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
				isUsingMFA: user.isUsingMFA(),
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

	static get relationMappings() {
		return {
			sessions: {
				relation: Model.HasManyRelation,
				modelClass: Session,
				join: {
					from: "users.id",
					to: "sessions.user_id",
				},
			},
			recoveryCodes: {
				relation: Model.HasManyRelation,
				modelClass: RecoveryCode,
				join: {
					from: "users.id",
					to: "recovery_codes.user_id",
				},
			},
		};
	}
}
