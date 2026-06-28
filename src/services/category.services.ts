import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";

export const listCategories = async ({ search }: { search?: string } = {}) => {
    const where: any = { active: true };

    if (search && search.trim()) {
        where.OR = [
            {
                name: {
                    contains: search,
                    mode: "insensitive",
                },
            },
            {
                slug: {
                    contains: search,
                    mode: "insensitive",
                },
            },
        ];
    }

    return prisma.category.findMany({
        where,
        orderBy: { name: "asc" },
    });
};

export const getCategoryById = async (id: number) => {
    const category = await prisma.category.findFirst({
        where: { id, active: true },
    });

    if (!category) {
        throw new Error("Categoria nao encontrada.");
    }

    return category;
};

export const createCategory = async (data: Prisma.CategoryCreateInput) => {
    const existingCategory = await prisma.category.findUnique({
        where: { slug: data.slug },
    });

    if (existingCategory) {
        throw new Error("Ja existe uma categoria com este slug.");
    }

    const newCategory = await prisma.category.create({ data });
    return newCategory;
};

export const updateCategory = async (id: number, data: Prisma.CategoryUpdateInput) => {
    const existingCategory = await prisma.category.findUnique({
        where: { id },
    });

    if (!existingCategory) {
        throw new Error("Categoria nao encontrada.");
    }

    const slugValue = typeof data.slug === "string" ? data.slug : data.slug?.set;
    if (slugValue) {
        const slugExists = await prisma.category.findUnique({
            where: { slug: slugValue },
        });

        if (slugExists && slugExists.id !== id) {
            throw new Error("Slug ja existe. Escolha outro nome para a categoria.");
        }
    }

    const updatedCategory = await prisma.category.update({
        where: { id },
        data,
    });

    return updatedCategory;
};

export const deleteCategory = async (id: number) => {
    const existingCategory = await prisma.category.findUnique({
        where: { id },
    });

    if (!existingCategory) {
        throw new Error("Categoria nao encontrada.");
    }

    if (!existingCategory.active) {
        throw new Error("Categoria ja esta inativa.");
    }

    await prisma.$transaction([
        prisma.category.update({
            where: { id },
            data: { active: false },
        }),
        prisma.product.updateMany({
            where: { categoryId: id },
            data: { active: false },
        }),
    ]);
};
