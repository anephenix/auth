// Dependencies
const { helloWorld, login } = require("./controllers");

const routes = [
	{ method: "GET", url: "/", handler: helloWorld },
	{ method: "POST", url: "/login", handler: login },
];

module.exports = routes;
