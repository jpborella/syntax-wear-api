import { FastifyReply, FastifyRequest } from "fastify";
import { CreateProduct, ProductFilters } from "../types";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from "../services/product.services";
import { createProductSchema, deleteProductSchema, productFiltersSchema, updateProductSchema, productIdSchema } from "../utils/validator";
import slugify from "slugify";

const ensureAdmin = (request: FastifyRequest, reply: FastifyReply) => {
	if (!request.authUser) {
		reply.status(401).send({ error: "Nao autenticado." });
		return false;
	}

	if (request.authUser.role !== "ADMIN") {
		reply.status(403).send({ error: "Acesso negado." });
		return false;
	}

	return true;
};

export const listProducts = async (request: FastifyRequest<{ Querystring: ProductFilters }>, reply: FastifyReply) => {
    const validation = productFiltersSchema.parse(request.query);

    const result = await getProducts(validation);
    reply.status(200).send(result);
};

export const getProduct = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const params = productIdSchema.parse({ id });
    const product = await getProductById(params.id);
    reply.status(200).send(product);
};

export const createNewProduct = async (request: FastifyRequest<{ Body: CreateProduct }>, reply: FastifyReply) => {
	if (!ensureAdmin(request, reply)) {
		return;
	}

    const body = request.body;

    body.slug = slugify(body.name, { lower: true, strict: true, locale: 'pt' });
	body.active = body.active ?? true;

    const validate = createProductSchema.parse(body);
    await createProduct(validate);

    reply.status(201).send({message: 'Produto criado com sucesso.'});
};

export const updateExistingProduct = async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateProduct> }>, reply: FastifyReply) => {
	if (!ensureAdmin(request, reply)) {
		return;
	}

	const { id } = request.params;
	const body = request.body;

    const params = productIdSchema.parse({ id });
	const validate = updateProductSchema.parse(body);

	if (validate.name) {
		validate.slug = slugify(validate.name, {
			lower: true,
			strict: true,
			locale: "pt",
		});
	}

	const product = await updateProduct(params.id, validate);
	reply.status(200).send(product);
};

export const deleteExistingProduct = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
	if (!ensureAdmin(request, reply)) {
		return;
	}

	const { id } = request.params;
    const params = productIdSchema.parse({ id });

	await deleteProduct(params.id);
	reply.status(204).send();
};
