import assert from "node:assert";
import { parse } from "../../utils/json";
import { describe, it } from "vitest";

describe("json utils", () => {
	describe("#parse", () => {
		describe("when the request body is valid JSON", () => {
			it("should parse the JSON data", async () => {
				const data = { foo: "bar" };
				const req: {
					body: string;
					on: (event: string, callback: (...args: unknown[]) => void) => void;
				} = { body: JSON.stringify(data), on: () => void 0 };
				req.on = (event, callback) => {
					if (event === "data") return callback(req.body);
					if (event === "end") return callback();
				};
				const parsed = await parse(req);
				assert.deepEqual(parsed, data);
			});
		});

		describe("when the request body is invalid JSON", () => {
			it.todo("should throw an error");
		});
	});

	describe("#handleError", () => {
		describe("when the error is a 400", () => {
			it.todo("should return a 400 status code");
		});

		describe("when the error is a 404", () => {
			it.todo("should return a 404 status code");
		});

		describe("when the error is a 500", () => {
			it.todo("should return a 500 status code");
		});
	});

	describe("#handleResponse", () => {
		describe("when the response is a 200", () => {
			it.todo("should return a 200 status code");
		});

		describe("when the response is a 201", () => {
			it.todo("should return a 201 status code");
		});

		describe("when the response is a 204", () => {
			it.todo("should return a 204 status code");
		});
	});

	describe("#handle", () => {
		describe("when the response is an error", () => {
			it.todo("should call handleError");
		});

		describe("when the response is data", () => {
			it.todo("should call handleResponse");
		});
	});
});
