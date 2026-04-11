import { FastifyInstance } from "fastify";
import { getProduct, listProducts } from "../controllers/products.controller";
import { authenticate } from "../middlewares/auth.middlewares";

export default async function productsRoutes(fastify: FastifyInstance) {
    fastify.addHook("onRequest", authenticate);
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Products"],
                description: "Lista todos os produtos com filtros opcionais.",
                querystring: {
                    type: "object",
                    properties: {
                        page: { type: "number", description: "Número da página." },
                        limit: { type: "number", description: "Quantidade de itens por página." },
                        minPrice: { type: "number", description: "Preço mínimo do produto." },
                        maxPrice: { type: "number", description: "Preço máximo do produto." },
                        search: { type: "string", description: "Buscar por nome do produto." },
                        sortBy: { type: "string", enum: ["price", "name", "createdAt"], description: "Campo para ordenação." },
                        sortOrder: { type: "string", enum: ["asc", "desc"], description: "Ordem de classificação." },
                    },
                },
                response: {
                    200: {
                        description: "Lista de produtos recuperada com sucesso.",
                        type: "object",
                        properties: {
                            data: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "number" },
                                        name: { type: "string" },
                                        price: { type: "number" },
                                        description: { type: "string" },
                                        slug: { type: "string" },
                                        sku: { type: "string" },
                                        images: { type: "array", items: { type: "string", format: "uri" } },
                                        sizes: { type: "array", items: { type: "string" } },
                                        colors: { type: "array", items: { type: "string" } },
                                        stock: { type: "number" },
                                        active: { type: "boolean" },
                                        categoryId: { type: "number" },
                                        createdAt: { type: "string", format: "date-time" },
                                        updatedAt: { type: "string", format: "date-time" },
                                    },
                                },
                            },
                            pagination: {
                                type: "object",
                                properties: {
                                    total: { type: "number", description: "Total de produtos." },
                                    page: { type: "number", description: "Página atual." },
                                    limit: { type: "number", description: "Itens por página." },
                                    pages: { type: "number", description: "Total de páginas." },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Parâmetros inválidos.",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Não autorizado.",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                },
            },
        },
        listProducts
    );

    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Products"],
                description: "Obtém um produto específico pelo ID.",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "number", description: "ID do produto." },
                    },
                    required: ["id"],
                },
                response: {
                    200: {
                        description: "Produto encontrado.",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            name: { type: "string" },
                            price: { type: "number" },
                            description: { type: "string" },
                            color: { type: "string" },
                            stock: { type: "number" },
                            size: { type: "array", items: { type: "string" } },
                            images: { type: "array", items: { type: "string", format: "uri" } },
                            colors: { type: "array", items: { type: "string" } },
                            slug: { type: "string" },
                            active: { type: "boolean" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                        },
                    },
                    400: {
                        description: "ID inválido.",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Não autorizado.",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                },
            },
        },
        getProduct
    );
}
