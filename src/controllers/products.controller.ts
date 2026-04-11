import { FastifyReply, FastifyRequest } from "fastify";
import { ProductFilters } from "../types";
import { getProducts } from "../services/product.services";
import { productFiltersSchema } from "../utils/validator";

export const listProducts = async (request: FastifyRequest<{ Querystring: ProductFilters }>, reply: FastifyReply) => {
    const validation = productFiltersSchema.parse(request.query);

    const result = await getProducts(validation);
    reply.send(result);
}