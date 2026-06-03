import { FastifyReply, FastifyRequest } from "fastify";
import slugify from "slugify";
import { CreateCategory, UpdateCategory } from "../types";
import {
    createCategory,
    deleteCategory,
    getCategoryById,
    listCategories as listCategoriesService,
    updateCategory,
} from "../services/category.services";
import {
    categoryIdSchema,
    createCategorySchema,
    updateCategorySchema,
} from "../utils/validator";

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

export const listCategories = async (
    _request: FastifyRequest,
    reply: FastifyReply
) => {
    const categories = await listCategoriesService();
    reply.status(200).send(categories);
};

export const getCategory = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    const { id } = request.params;
    const params = categoryIdSchema.parse({ id });

    const category = await getCategoryById(params.id);
    reply.status(200).send(category);
};

export const createNewCategory = async (
    request: FastifyRequest<{ Body: CreateCategory }>,
    reply: FastifyReply
) => {
    if (!ensureAdmin(request, reply)) {
        return;
    }

    const body = request.body;

    body.slug = slugify(body.name, { lower: true, strict: true, locale: "pt" });
    body.active = body.active ?? true;

    const validation = createCategorySchema.parse(body);
    await createCategory(validation);

    reply.status(201).send({ message: "Categoria criada com sucesso." });
};

export const updateExistingCategory = async (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategory }>,
    reply: FastifyReply
) => {
    if (!ensureAdmin(request, reply)) {
        return;
    }

    const { id } = request.params;
    const body = request.body;

    const params = categoryIdSchema.parse({ id });
    const validation = updateCategorySchema.parse(body);

    if (validation.name) {
        validation.slug = slugify(validation.name, {
            lower: true,
            strict: true,
            locale: "pt",
        });
    }

    const category = await updateCategory(params.id, validation);
    reply.status(200).send(category);
};

export const deleteExistingCategory = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    if (!ensureAdmin(request, reply)) {
        return;
    }

    const { id } = request.params;
    const params = categoryIdSchema.parse({ id });

    await deleteCategory(params.id);
    reply.status(204).send();
};
