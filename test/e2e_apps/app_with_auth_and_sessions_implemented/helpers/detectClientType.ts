import type { FastifyRequest } from "fastify/types/request";

type ClientTypes = "web" | "api";

/*
    This function is used to detect the type of client making the request.
    It checks the 'x-client-type' header (if passed)
    Then it checks the 'accept' header to determine if the request is coming from a web client

    If neither is present, it defaults to 'api'.

    This is used to help determin how the POST /login endpoint should react when a user successfully logs in.

    If the client is a web client, it will set the session cookie.
    If the client is an API client, it will return the tokens in the response body.
*/
function detectClientType(request: FastifyRequest): ClientTypes {
	const clientHeader = request.headers["x-client-type"];
	const acceptHeader = request.headers.accept ?? "";

	if (clientHeader === "web" || acceptHeader.includes("text/html")) {
		return "web";
	}

	return "api";
}

export default detectClientType;
