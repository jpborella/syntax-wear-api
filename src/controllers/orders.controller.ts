import { FastifyReply, FastifyRequest } from "fastify";
import { CreateOrder, OrderFilters, UpdateOrder } from "../types";
import { createOrder, deleteOrder, getOrderById, listOrders, updateOrderStatus } from "../services/order.services";
import { createOrderSchema, orderFiltersSchema, orderIdSchema, updateOrderSchema } from "../utils/validator";

export const listOrdersHandler = async (
    request: FastifyRequest<{ Querystring: OrderFilters }>,
    reply: FastifyReply
) => {
    if (!request.authUser) {
        reply.status(401).send({ error: "Nao autenticado." });
        return;
    }

    const filters = orderFiltersSchema.parse(request.query);
    const result = await listOrders(filters, request.authUser);
    reply.status(200).send(result);
};

export const getOrderHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    if (!request.authUser) {
        reply.status(401).send({ error: "Nao autenticado." });
        return;
    }

    const params = orderIdSchema.parse({ id: request.params.id });
    const order = await getOrderById(params.id, request.authUser);
    reply.status(200).send(order);
};

export const createOrderHandler = async (
    request: FastifyRequest<{ Body: CreateOrder }>,
    reply: FastifyReply
) => {
    if (!request.authUser) {
        reply.status(401).send({ error: "Nao autenticado." });
        return;
    }

    const payload = createOrderSchema.parse(request.body);
    const order = await createOrder(payload, request.authUser.id);
    reply.status(201).send({ message: "Pedido criado com sucesso.", data: order });
};

export const updateOrderHandler = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateOrder }>,
    reply: FastifyReply
) => {
    if (!request.authUser) {
        reply.status(401).send({ error: "Nao autenticado." });
        return;
    }

    const params = orderIdSchema.parse({ id: request.params.id });
    const payload = updateOrderSchema.parse(request.body);
    const order = await updateOrderStatus(params.id, payload.status, request.authUser);
    reply.status(200).send(order);
};

export const deleteOrderHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    if (!request.authUser) {
        reply.status(401).send({ error: "Nao autenticado." });
        return;
    }

    const params = orderIdSchema.parse({ id: request.params.id });
    await deleteOrder(params.id, request.authUser);
    reply.status(200).send({ message: "Pedido cancelado com sucesso." });
};
