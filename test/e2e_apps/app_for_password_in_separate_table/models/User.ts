import { Model, type RelationMappings } from "objection";
import { isEmail } from "../../../utils/comparators";
import auth from "../auth";
import db from "../db";
import Password from "./Password";

// Attach the knex connection instance to the Model
Model.knex(db);

export class User extends Model {
	id!: number;
	username!: string;
	email?: string;
	failed_login_attempts!: number;
	failed_login_window_started_at?: string | null;

	static get tableName() {
		return "users";
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

	static get relationMappings(): RelationMappings {
		return {
			passwords: {
				relation: Model.HasManyRelation,
				modelClass: Password,
				join: {
					from: "users.id",
					to: "passwords.user_id",
				},
			},
		};
	}

	// This is an implementation of the User.authenticate method, used previously in a different project.
	static async authenticate(payload: { identifier: string; password: string }) {
		const { identifier, password } = payload;
		const normalizedIdentifier = auth.normalize(identifier ? identifier : "");
		const params: { [key: string]: string } = {};
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

		/*
			I discovered that the created_at field's timestamps are accurate to the second,
			which means that we cannot reliably use them in a unit test to determine the most recent password.

			Therefore, because the id is a numerical auto-incrementing field,
			I will use the most recent password by ordering by id in descending order.

			In reality, we'd need to use a more precise timestamp (to the millisecond or nanosecond) to help pass the unit tests
		*/
		const passwordRecord = user
			? ((await user
					.$relatedQuery("passwords")
					.orderBy("id", "desc")
					.limit(1)
					.first()) as Password)
			: undefined;
		const isAuthenticated = await auth.verifyPasswordSafe(
			password,
			passwordRecord?.hashed_password,
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

// Question - I wonder if... I should offer a ModelWrapper for easier usage of the auth instance?

export default User;
