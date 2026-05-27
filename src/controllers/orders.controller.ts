import { FastifyReply, FastifyRequest } from "fastify";
import { OrderFilters } from "../types";
import { getOrderById, listOrders } from "../services/order.services";
import { orderFiltersSchema, orderIdSchema } from "../utils/validator";

export const listOrdersHandler = async (
    request: FastifyRequest<{ Querystring: OrderFilters }>,
    reply: FastifyReply
) => {
    const filters = orderFiltersSchema.parse(request.query);
    const result = await listOrders(filters);
    reply.status(200).send(result);
};

export const getOrderHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    const params = orderIdSchema.parse({ id: request.params.id });
    const order = await getOrderById(params.id);
    reply.status(200).send(order);
};
