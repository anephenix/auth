// Function to parse JSON from a request as a Promise
function parse(req) {
	return new Promise((resolve, reject) => {
		let requestBody = '';

		req.on('data', (chunk) => {
			// Accumulate the incoming data
			requestBody += chunk.toString();
		});

		req.on('end', () => {
			try {
				// Parse the JSON data
				const jsonData = JSON.parse(requestBody);
				resolve(jsonData);
			} catch (error) {
				// Handle JSON parsing errors
				reject(error);
			}
		});
	});
}

const handleError = ({ res, statusCode = 400, err }) => {
	res.writeHead(statusCode, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ error: err.message }));
};

const handleResponse = ({ res, statusCode = 200, data }) => {
	res.writeHead(statusCode, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(data));
};

const handle = ({ res, err, data, statusCode }) => {
	if (err) return handleError({ res, statusCode, err });
	handleResponse({ res, statusCode, data });
};

module.exports = {
	parse,
	handleError,
	handleResponse,
	handle,
};
