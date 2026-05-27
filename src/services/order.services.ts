import { prisma } from "../utils/prisma";
import { OrderFilters } from "../types";

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
