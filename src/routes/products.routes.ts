import { FastifyInstance } from "fastify";
import { listProducts } from "../controllers/products.controller";
import { authenticate } from "../middlewares/auth.middlewares";

export default async function productsRoutes(fastify: FastifyInstance) {
    fastify.addHook("onRequest", authenticate);
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Products"],
                description: "Lista todos os produtos com filtros opcionais",
                querystring: {
                    type: "object",
                    properties: {
                        page: { type: "number", description: "Número da página" },
                        limit: { type: "number", description: "Quantidade de itens por página" },
                        minPrice: { type: "number", description: "Preço mínimo do produto" },
                        maxPrice: { type: "number", description: "Preço máximo do produto" },
                        search: { type: "string", description: "Buscar por nome do produto" },
                        sortBy: { type: "string", enum: ["price", "name", "createdAt"], description: "Campo para ordenação" },
                        sortOrder: { type: "string", enum: ["asc", "desc"], description: "Ordem de classificação" },
                    },
                },
            },
        },
        listProducts
    );
    };
    
