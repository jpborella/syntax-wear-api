import "fastify";
import { AuthenticatedUser } from "./index";

declare module "fastify" {
    interface FastifyRequest {
        authUser?: AuthenticatedUser;
    }
}
