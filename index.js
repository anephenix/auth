// Dependencies
const http = require('http');
const { port } = require('./config');
const router = require('./router');
const server = http.createServer(router);
server.listen(port);
