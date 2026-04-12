import { FastifyReply, FastifyRequest } from "fastify";
import { CreateProduct, ProductFilters } from "../types";
import { getProducts, getProductById, saveProduct } from "../services/product.services";
import { createProductSchema, productFiltersSchema } from "../utils/validator";
import slugify from "slugify";


export const listProducts = async (request: FastifyRequest<{ Querystring: ProductFilters }>, reply: FastifyReply) => {
    const validation = productFiltersSchema.parse(request.query);

    const result = await getProducts(validation);
    reply.status(200).send(result);
};

export const getProduct = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const product = await getProductById(Number(id));
    reply.status(200).send(product);
};

export const createNewProduct = async (request: FastifyRequest<{ Body: CreateProduct }>, reply: FastifyReply) => {

    const body = request.body;

    body.slug = slugify(body.name, { lower: true, strict: true, locale: 'pt' });

    const validate = createProductSchema.parse(body);
    await saveProduct(validate);

    reply.status(201).send({message: 'Produto criado com sucesso.'});
};