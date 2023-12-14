// Dependencies
const routes = require('./routes');
const { notFound } = require('./controllers');

const logRequest = (req) => {
	console.log(`${req.method} ${req.url}`);
};

const router = async (req, res) => {
	logRequest(req);
	const route = routes.find((route) => {
		return route.method === req.method && route.url === req.url;
	});
	if (route) return await route.handler(req, res);
	return notFound(req, res);
};

module.exports = router;
