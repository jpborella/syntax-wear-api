import type { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { AuthenticatedUser, CartItemInput } from "../types";

type CartDatabaseClient = Pick<Prisma.TransactionClient, "cartItem">;

const findCartItems = (database: CartDatabaseClient, userId: number) => database.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "asc" },
});

export const getCart = (user: AuthenticatedUser) => findCartItems(prisma, user.id);

export const replaceCart = async (user: AuthenticatedUser, items: CartItemInput[]) => {
    const itemsByProduct = new Map<number, number>();

    for (const item of items) {
        itemsByProduct.set(item.productId, (itemsByProduct.get(item.productId) ?? 0) + item.quantity);
    }

    const normalizedItems = Array.from(itemsByProduct, ([productId, quantity]) => ({ productId, quantity }));
    const productIds = normalizedItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds }, active: true },
        select: { id: true },
    });

    if (products.length !== productIds.length) {
        throw new Error("Produto não encontrado ou inativo.");
    }

    return prisma.$transaction(async (transaction) => {
        await transaction.cartItem.deleteMany({ where: { userId: user.id } });

        if (normalizedItems.length > 0) {
            await transaction.cartItem.createMany({
                data: normalizedItems.map((item) => ({ ...item, userId: user.id })),
            });
        }

        return findCartItems(transaction, user.id);
    });
};

export const clearCart = (user: AuthenticatedUser) =>
    prisma.cartItem.deleteMany({ where: { userId: user.id } });