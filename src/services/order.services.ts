import { Prisma, OrderStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { AuthenticatedUser, CreateOrder, OrderFilters, NotFoundError, ForbiddenError } from "../types";
import { validateOwnership } from "../utils/auth.utils";

type OrderWithItems = Prisma.OrderGetPayload<{
    include: {
        items: true;
    };
}>;

const isAdmin = (user: AuthenticatedUser) => user.role === "ADMIN";

const findOrderWithItems = async (id: number): Promise<OrderWithItems> => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            items: true,
        },
    });

    if (!order) {
        throw new NotFoundError("Pedido nao encontrado.");
    }

    return order;
};

const applyOrderStatus = async (
    order: OrderWithItems,
    status: OrderStatus,
    user: AuthenticatedUser
) => {
    if (order.status === status) {
        return getOrderById(order.id, user);
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
            where: { id: order.id },
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

export const listOrders = async (filters: OrderFilters, user: AuthenticatedUser) => {
    const { page = 1, limit = 10, status, userId } = filters;

    const where: Prisma.OrderWhereInput = {};

    if (status) {
        where.status = status;
    }

    if (isAdmin(user)) {
        if (userId) {
            where.userId = userId;
        }
    } else {
        if (userId && userId !== user.id) {
            throw new ForbiddenError("Acesso negado.");
        }

        where.userId = user.id;
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
                items: true,
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

export const getOrderById = async (id: number, user: AuthenticatedUser) => {
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
        throw new NotFoundError("Pedido nao encontrado.");
    }

    validateOwnership(user, order.userId);

    return order;
};

export const createOrder = async (payload: CreateOrder, userId: number) => {
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
            shippingAddress: payload.shippingAddress as unknown as Prisma.InputJsonValue,
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

export const updateOrderStatus = async (
    id: number,
    status: OrderStatus,
    user: AuthenticatedUser
) => {
    if (!isAdmin(user)) {
        throw new ForbiddenError("Acesso negado.");
    }

    const order = await findOrderWithItems(id);
    return applyOrderStatus(order, status, user);
};

export const deleteOrder = async (id: number, user: AuthenticatedUser) => {
    const order = await findOrderWithItems(id);
    validateOwnership(user, order.userId);

    await applyOrderStatus(order, "CANCELLED", user);
};
