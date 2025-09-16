import "fastify";
import type { User } from "../models/User";

declare module "fastify" {
	interface FastifyRequest {
		access_token?: string;
		user?: User;
	}
}
