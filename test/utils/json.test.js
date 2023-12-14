const assert = require('assert');
const { parse } = require('../../utils/json');

describe('json utils', () => {
	describe('#parse', () => {
		describe('when the request body is valid JSON', () => {
			it('should parse the JSON data', async () => {
				const data = { foo: 'bar' };
				const req = { body: JSON.stringify(data) };
				req.on = (event, callback) => {
					if (event === 'data') return callback(req.body);
					if (event === 'end') return callback();
				};
				const parsed = await parse(req);
				assert.deepEqual(parsed, data);
			});
		});

		describe('when the request body is invalid JSON', () => {
			it('should throw an error');
		});
	});

	describe('#handleError', () => {
		describe('when the error is a 400', () => {
			it('should return a 400 status code');
		});

		describe('when the error is a 404', () => {
			it('should return a 404 status code');
		});

		describe('when the error is a 500', () => {
			it('should return a 500 status code');
		});
	});

	describe('#handleResponse', () => {
		describe('when the response is a 200', () => {
			it('should return a 200 status code');
		});

		describe('when the response is a 201', () => {
			it('should return a 201 status code');
		});

		describe('when the response is a 204', () => {
			it('should return a 204 status code');
		});
	});

	describe('#handle', () => {
		describe('when the response is an error', () => {
			it('should call handleError');
		});

		describe('when the response is data', () => {
			it('should call handleResponse');
		});
	});
});
