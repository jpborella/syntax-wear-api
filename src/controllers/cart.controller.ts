import { FastifyReply, FastifyRequest } from "fastify";
import { CartItemInput } from "../types";
import { clearCart, getCart, replaceCart } from "../services/cart.services";
import { updateCartSchema } from "../utils/validator";

const getAuthenticatedUser = (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
        reply.status(401).send({ error: "Usuário não autenticado." });
        return null;
    }

    return request.authUser;
};

export const getCartHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthenticatedUser(request, reply);
    if (!user) return;

    return reply.send({ items: await getCart(user) });
};

export const replaceCartHandler = async (
    request: FastifyRequest<{ Body: { items: CartItemInput[] } }>,
    reply: FastifyReply,
) => {
    const user = getAuthenticatedUser(request, reply);
    if (!user) return;

    const payload = updateCartSchema.parse(request.body);
    return reply.send({ items: await replaceCart(user, payload.items) });
};

export const clearCartHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthenticatedUser(request, reply);
    if (!user) return;

    await clearCart(user);
    return reply.status(204).send();
};