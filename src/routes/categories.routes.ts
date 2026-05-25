import { FastifyInstance } from "fastify";
import {
    createNewCategory,
    deleteExistingCategory,
    getCategory,
    listCategories,
    updateExistingCategory,
} from "../controllers/categories.controller";
import { authenticate } from "../middlewares/auth.middleware";

export default async function categoryRoutes(fastify: FastifyInstance) {
    fastify.addHook("onRequest", authenticate);

    fastify.get(
        "/",
        {
            schema: {
                tags: ["Categories"],
                description: "Lista categorias",
                response: {
                    200: {
                        description: "Lista de categorias",
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "number" },
                                name: { type: "string" },
                                slug: { type: "string" },
                                description: { type: "string", nullable: true },
                                active: { type: "boolean" },
                                createdAt: { type: "string", format: "date-time" },
                                updatedAt: { type: "string", format: "date-time" },
                            },
                        },
                    },
                    400: {
                        description: "Requisicao invalida",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Nao autorizado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        listCategories
    );

    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Categories"],
                description: "Obter categoria por ID",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: {
                        description: "Categoria encontrada",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            name: { type: "string" },
                            slug: { type: "string" },
                            description: { type: "string", nullable: true },
                            active: { type: "boolean" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                        },
                    },
                    400: {
                        description: "Requisicao invalida",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Nao autorizado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                    404: {
                        description: "Categoria nao encontrada",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        getCategory
    );

    fastify.post(
        "/",
        {
            schema: {
                tags: ["Categories"],
                description: "Criar categoria",
                body: {
                    type: "object",
                    required: ["name"],
                    properties: {
                        name: { type: "string", description: "Nome da categoria" },
                        description: {
                            type: "string",
                            description: "Descricao da categoria",
                        },
                        active: {
                            type: "boolean",
                            description: "Categoria ativa",
                        },
                    },
                },
                response: {
                    201: {
                        description: "Categoria criada com sucesso",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    400: {
                        description: "Erro de validacao",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                            errors: { type: "object" },
                        },
                    },
                    401: {
                        description: "Nao autorizado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        createNewCategory
    );

    fastify.put(
        "/:id",
        {
            schema: {
                tags: ["Categories"],
                description: "Atualizar categoria",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "ID da categoria" },
                    },
                    required: ["id"],
                },
                body: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        active: { type: "boolean" },
                    },
                },
                response: {
                    200: {
                        description: "Categoria atualizada",
                        type: "object",
                        properties: {
                            id: { type: "number" },
                            name: { type: "string" },
                            slug: { type: "string" },
                            description: { type: "string", nullable: true },
                            active: { type: "boolean" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                        },
                    },
                    400: {
                        description: "Erro de validacao",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                            details: { type: "array", nullable: true },
                        },
                    },
                    404: {
                        description: "Categoria nao encontrada",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                    401: {
                        description: "Nao autorizado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        updateExistingCategory
    );

    fastify.delete(
        "/:id",
        {
            schema: {
                tags: ["Categories"],
                description: "Desativar categoria",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "ID da categoria" },
                    },
                    required: ["id"],
                },
                response: {
                    204: {
                        description: "Categoria desativada com sucesso",
                        type: "null",
                    },
                    404: {
                        description: "Categoria nao encontrada",
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                    401: {
                        description: "Nao autorizado",
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
        },
        deleteExistingCategory
    );
}
