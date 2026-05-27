import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { CreateOrder, OrderFilters, OrderStatus } from "../types";

export const listOrders = async (filters: OrderFilters) => {
    const { page = 1, limit = 10, status, userId } = filters;

    const where: any = {};

    if (status) {
        where.status = status;
    }

    if (userId) {
        where.userId = userId;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        }),
        prisma.order.count({ where }),
    ]);

    return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

export const getOrderById = async (id: number) => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!order) {
        throw new Error("Pedido nao encontrado.");
    }

    return order;
};

export const createOrder = async (payload: CreateOrder) => {
    let userId: number | null = null;

    if (payload.userId !== undefined) {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("Usuario nao encontrado.");
        }

        userId = user.id;
    }

    const quantityByProductId = new Map<number, number>();

    for (const item of payload.items) {
        const currentQuantity = quantityByProductId.get(item.productId) ?? 0;
        quantityByProductId.set(item.productId, currentQuantity + item.quantity);
    }

    const productIds = Array.from(quantityByProductId.keys());

    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds },
            active: true,
        },
        select: {
            id: true,
            price: true,
            stock: true,
        },
    });

    if (products.length !== productIds.length) {
        throw new Error("Produto nao encontrado ou inativo.");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const [productId, quantity] of quantityByProductId.entries()) {
        const product = productMap.get(productId);

        if (!product) {
            throw new Error("Produto nao encontrado ou inativo.");
        }

        if (product.stock < quantity) {
            throw new Error("Estoque insuficiente para o produto selecionado.");
        }
    }

    let total = new Prisma.Decimal(0);
    const itemsData = Array.from(quantityByProductId.entries()).map(([productId, quantity]) => {
        const product = productMap.get(productId)!;
        total = total.plus(product.price.mul(quantity));

        return {
            productId,
            price: product.price,
            quantity,
        };
    });

    const order = await prisma.order.create({
        data: {
            userId,
            paymentMethod: payload.paymentMethod,
            shippingAddress: payload.shippingAddress,
            total,
            status: "PENDING",
            items: {
                create: itemsData,
            },
        },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    return order;
};

export const updateOrderStatus = async (id: number, status: OrderStatus) => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            items: true,
        },
    });

    if (!order) {
        throw new Error("Pedido nao encontrado.");
    }

    if (order.status === status) {
        return getOrderById(id);
    }

    const quantityByProductId = new Map<number, number>();

    for (const item of order.items) {
        const currentQuantity = quantityByProductId.get(item.productId) ?? 0;
        quantityByProductId.set(item.productId, currentQuantity + item.quantity);
    }

    const productIds = Array.from(quantityByProductId.keys());
    const products = await prisma.product.findMany({
        where: {
            id: { in: productIds },
            active: true,
        },
        select: {
            id: true,
            stock: true,
        },
    });

    if (products.length !== productIds.length) {
        throw new Error("Produto nao encontrado ou inativo.");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    const shouldDecrement = status === "PAID" && order.status !== "PAID";
    const shouldIncrement = status === "CANCELLED" && order.status === "PAID";

    if (shouldDecrement) {
        for (const [productId, quantity] of quantityByProductId.entries()) {
            const product = productMap.get(productId);

            if (!product) {
                throw new Error("Produto nao encontrado ou inativo.");
            }

            if (product.stock < quantity) {
                throw new Error("Estoque insuficiente para o produto selecionado.");
            }
        }
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
        if (shouldDecrement) {
            await Promise.all(
                Array.from(quantityByProductId.entries()).map(([productId, quantity]) =>
                    tx.product.update({
                        where: { id: productId },
                        data: { stock: { decrement: quantity } },
                    })
                )
            );
        }

        if (shouldIncrement) {
            await Promise.all(
                Array.from(quantityByProductId.entries()).map(([productId, quantity]) =>
                    tx.product.update({
                        where: { id: productId },
                        data: { stock: { increment: quantity } },
                    })
                )
            );
        }

        return tx.order.update({
            where: { id },
            data: { status },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    });

    return updatedOrder;
};
