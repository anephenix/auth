const accounts = [
	{ id: '1', username: 'paulbjensen', password: 'letmein' },
	{ id: '2', username: 'admin', password: 'admin' },
];

const sessions = [];

const matchedAccount = ({ username, password }) => {
	const match = (account) => {
		return account.username === username && account.password === password;
	};
	return accounts.find(match);
};

// TODO - think about services as a way to abstract away the distribution channel, and communicate with the data
const authenticate = ({ username, password }) => {
	const account = matchedAccount({ username, password });
	return account;
};

const createSession = ({ id }) => {
	const token = Math.random().toString(36).substring(2, 15);
	const expires = new Date(Date.now() + 3600000);
	const session = { token, expires, userId: id };
	sessions.push(session);
	return session;
};

const login = ({ username, password }) => {
	const account = authenticate({ username, password });
	if (!account) throw new Error('Authentication Failed');
	const session = createSession(account);
	return session;
};

module.exports = {
	login,
	authenticate,
	createSession,
};
