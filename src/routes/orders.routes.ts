import { FastifyInstance } from "fastify";
import { authenticate } from "../middlewares/auth.middleware";
import { getOrderHandler, listOrdersHandler } from "../controllers/orders.controller";

export default async function orderRoutes(fastify: FastifyInstance) {
    //fastify.addHook("onRequest", authenticate);

    fastify.get(
        "/",
        {
            schema: {
                tags: ["Orders"],
                description: "Lista pedidos",
                querystring: {
                    type: "object",
                    properties: {
                        page: { type: "number" },
                        limit: { type: "number" },
                        status: {
                            type: "string",
                            enum: ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"],
                        },
                        userId: { type: "number" },
                    },
                },
                response: {
                    200: {
                        description: "Lista de pedidos",
                        type: "object",
                        properties: {
                            data: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "number" },
                                        userId: { type: "number", nullable: true },
                                        total: { type: "number" },
                                        status: { type: "string" },
                                        paymentMethod: { type: "string" },
                                        shippingAddress: {
                                            type: "object",
                                            additionalProperties: true,
                                        },
                                        createdAt: { type: "string", format: "date-time" },
                                        updatedAt: { type: "string", format: "date-time" },
                                        items: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "number" },
                                                    productId: { type: "number" },
                                                    price: { type: "number" },
                                                    quantity: { type: "number" },
                                                    product: { type: "object", additionalProperties: true },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            total: { type: "number" },
                            page: { type: "number" },
                            limit: { type: "number" },
                            totalPages: { type: "number" },
                        },
                    },
                    400: {
                        description: "Erro de validacao",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            errors: { type: "object", additionalProperties: true },
                        },
                    },
                    401: {
                        description: "Nao autorizado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                    500: {
                        description: "Erro interno do servidor",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            debug: { type: "string" },
                        },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        listOrdersHandler
    );

    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Orders"],
                description: "Obter pedido por ID",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: {
                        description: "Pedido encontrado",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            userId: { type: "number", nullable: true },
                            total: { type: "number" },
                            status: { type: "string" },
                            paymentMethod: { type: "string" },
                            shippingAddress: {
                                type: "object",
                                additionalProperties: true,
                            },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                            items: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "number" },
                                        productId: { type: "number" },
                                        price: { type: "number" },
                                        quantity: { type: "number" },
                                        product: { type: "object", additionalProperties: true },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Erro de validacao",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            errors: { type: "object", additionalProperties: true },
                        },
                    },
                    401: {
                        description: "Nao autorizado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                    500: {
                        description: "Erro interno do servidor",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            debug: { type: "string" },
                        },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        getOrderHandler
    );
}
