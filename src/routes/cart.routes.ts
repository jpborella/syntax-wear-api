import { FastifyInstance } from "fastify";
import { authenticate } from "../middlewares/auth.middleware";
import { clearCartHandler, getCartHandler, replaceCartHandler } from "../controllers/cart.controller";

export default async function cartRoutes(fastify: FastifyInstance) {
    fastify.addHook("onRequest", authenticate);
    fastify.get("/", getCartHandler);
    fastify.put("/", replaceCartHandler);
    fastify.delete("/", clearCartHandler);
}