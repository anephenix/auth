/* A user has many memberships, and has many organisations through memberships. */

// Dependencies
const { Model } = require('objection');
const rounds = 12;
const Password = require('objection-password')({ rounds });
// const { relation } = require('../helpers/relations');
const { db } = require('../db');

/* Connects the Objection.js model to the Postgres database */
Model.knex(db);

class User extends Password(Model) {
	/* Always define the table in the db that the model refers to */
	static get tableName() {
		return 'users';
	}

	/* This runs sets timestamps before a record is inserted into the database */
	async $beforeInsert(queryContext) {
		await super.$beforeInsert(queryContext);
		const date = new Date().toISOString();
		this.created_at = date;
		this.updated_at = date;
	}

	/* This runs updates a timestamp before a record is updated in the database */
	async $beforeUpdate(queryContext) {
		await super.$beforeUpdate(queryContext);
		this.updated_at = new Date().toISOString();
	}

	async $beforeDelete(queryContext) {
		await super.$beforeDelete(queryContext);
	}

	/* This defines the data schema for the model */
	static get jsonSchema() {
		return {
			type: 'object',
			required: ['username', 'email'],

			properties: {
				id: { type: 'string', readOnly: true },
				username: {
					type: 'string',
					minLength: 2,
					maxLength: 64,
					pattern: String.raw`^([\w\d]){1,255}$`,
				},
				email: {
					type: 'string',
					format: 'email',
					pattern: String.raw`^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$`,
					minLength: 1,
					maxLength: 255,
				},
				password: {
					type: 'string',
					minLength: 10,
					maxLength: 255,
					writeOnly: true,
				},
				created_at: {
					type: 'string',
					format: 'date-time',
					readOnly: true,
				},
				updated_at: { type: 'string', format: 'date-time' },
			},
		};
	}

	// static async authenticate(payload) {
	// 	const { identifier, password } = payload;
	// 	const params = {};
	// 	const key = identifier.match('@') ? 'email' : 'username';
	// 	params[key] = identifier;
	// 	const user = await this.query().where(params).limit(1).first();
	// 	if (!user) throw new UserNotFoundError();
	// 	if (user.is_deactivated) throw new UserDeactivatedError();
	// 	const authenticated = await user.verifyPassword(password);
	// 	if (authenticated) {
	// 		return {
	// 			id: user.id,
	// 			username: user.username,
	// 			timestamp: Date.now(),
	// 		};
	// 	} else {
	// 		throw new PasswordIncorrectError();
	// 	}
	// }

	// static async deactivate(id, password) {
	// 	const users = await this.query().where({ id });
	// 	const user = users[0];
	// 	if (!user) throw new Error('User not found');
	// 	const authenticated = await user.verifyPassword(password);
	// 	if (!authenticated) throw new Error('Password is invalid');
	// 	await this.query().patch({ is_deactivated: true }).where({ id });
	// 	return true;
	// }

	// // Note - is there a way to do this via a graph upsert instead?
	// static async generateForgottenPasswordRequest(id) {
	// 	return await this.query().upsertGraph(
	// 		{
	// 			id,
	// 			forgotPasswords: [{}],
	// 		},
	// 		{ relate: true, unrelate: false }
	// 	);
	// }

	// /* Here is where we define relationships between models */
	// static get relationMappings() {
	// 	const model = this.name;
	// 	return {
	// 		forgotPasswords: relation(model, 'hasMany', 'ForgotPassword'),
	// 		customer: relation(model, 'hasOne', 'Customer'),
	// 	};
	// }
}

// Expose the model
module.exports = User;
