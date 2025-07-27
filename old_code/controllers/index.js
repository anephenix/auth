// Dependencies
const services = require("../../services");
const { parse, handle } = require("../utils/json");

const notFound = (req, res) =>
	handle({ res, statusCode: 404, err: new Error("Not Found") });

const helloWorld = (req, res) => handle({ res, data: "Hello World" });

const login = async (req, res) => {
	try {
		const body = await parse(req);
		const session = await services.login(body);
		const data = { sessionToken: session.token, expires: session.expires };
		handle({ res, data });
	} catch (err) {
		handle({ res, err });
	}
};

const controllers = {
	helloWorld,
	login,
	notFound,
};

module.exports = controllers;
