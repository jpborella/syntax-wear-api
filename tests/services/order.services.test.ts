import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Prisma } from '@prisma/client';

// Mock do Prisma
vi.mock('../../src/utils/prisma', () => ({
    prisma: {
        order: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        product: {
            findMany: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

// Importar depois dos mocks
import {
    listOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder,
} from '../../src/services/order.services';
import { prisma } from '../../src/utils/prisma';
import { NotFoundError, ForbiddenError, AuthenticatedUser, CreateOrder, ShippingAddress } from '../../src/types';

describe('Order Services', () => {
    const mockAuthUser: AuthenticatedUser = {
        id: 1,
        role: 'USER',
    };

    const mockAdminUser: AuthenticatedUser = {
        id: 2,
        role: 'ADMIN',
    };

    const mockShippingAddress: ShippingAddress = {
        cep: '01310100',
        street: 'Avenida Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
    };

    const mockOrder = {
        id: 1,
        userId: 1,
        total: new Prisma.Decimal('100.00'),
        status: 'PENDING' as const,
        paymentMethod: 'CARD' as const,
        shippingAddress: mockShippingAddress,
        items: [
            {
                id: 1,
                orderId: 1,
                productId: 1,
                price: new Prisma.Decimal('50.00'),
                quantity: 2,
                product: {
                    id: 1,
                    name: 'Produto 1',
                    price: new Prisma.Decimal('50.00'),
                    stock: 10,
                    active: true,
                },
            },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockProduct = {
        id: 1,
        name: 'Produto 1',
        categoryId: 1,
        price: new Prisma.Decimal('50.00'),
        stock: 10,
        active: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listOrders', () => {
        it('deve listar pedidos do usuário logado', async () => {
            // Arrange
            const mockOrders = [mockOrder];
            const totalCount = 1;
            (prisma.order.findMany as any).mockResolvedValueOnce(mockOrders);
            (prisma.order.count as any).mockResolvedValueOnce(totalCount);

            // Act
            const result = await listOrders({ page: 1, limit: 10 }, mockAuthUser);

            // Assert
            expect(result.data).toEqual(mockOrders);
            expect(result.total).toBe(totalCount);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ userId: mockAuthUser.id }),
                })
            );
        });

        it('deve aplicar filtro de status', async () => {
            // Arrange
            (prisma.order.findMany as any).mockResolvedValueOnce([mockOrder]);
            (prisma.order.count as any).mockResolvedValueOnce(1);

            // Act
            await listOrders({ page: 1, limit: 10, status: 'PENDING' }, mockAuthUser);

            // Assert
            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: 'PENDING' }),
                })
            );
        });

        it('admin deve listar pedidos de outros usuários', async () => {
            // Arrange
            (prisma.order.findMany as any).mockResolvedValueOnce([mockOrder]);
            (prisma.order.count as any).mockResolvedValueOnce(1);

            // Act
            await listOrders({ page: 1, limit: 10, userId: 1 }, mockAdminUser);

            // Assert
            expect(prisma.order.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ userId: 1 }),
                })
            );
        });

        it('usuário comum deve ter acesso negado ao listar pedidos de outro usuário', async () => {
            // Arrange
            // Act & Assert
            await expect(
                listOrders({ page: 1, limit: 10, userId: 999 }, mockAuthUser)
            ).rejects.toThrow(ForbiddenError);
        });

        it('deve calcular páginas corretamente', async () => {
            // Arrange
            (prisma.order.findMany as any).mockResolvedValueOnce([]);
            (prisma.order.count as any).mockResolvedValueOnce(25);

            // Act
            const result = await listOrders({ page: 1, limit: 10 }, mockAuthUser);

            // Assert
            expect(result.totalPages).toBe(3);
        });
    });

    describe('getOrderById', () => {
        it('deve retornar pedido por ID', async () => {
            // Arrange
            (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);

            // Act
            const result = await getOrderById(1, mockAuthUser);

            // Assert
            expect(result).toEqual(mockOrder);
            expect(prisma.order.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                })
            );
        });

        it('deve lançar erro se pedido não encontrado', async () => {
            // Arrange
            (prisma.order.findUnique as any).mockResolvedValueOnce(null);

            // Act & Assert
            await expect(getOrderById(999, mockAuthUser)).rejects.toThrow(NotFoundError);
        });

        it('deve bloquear acesso a pedido de outro usuário', async () => {
            // Arrange
            const otherUserOrder = { ...mockOrder, userId: 999 };
            (prisma.order.findUnique as any).mockResolvedValueOnce(otherUserOrder);

            // Act & Assert
            await expect(getOrderById(1, mockAuthUser)).rejects.toThrow('Você não tem permissão para acessar este recurso.');
        });

        it('deve permitir que admin veja pedido de outro usuário', async () => {
            // Arrange
            const otherUserOrder = { ...mockOrder, userId: 999 };
            (prisma.order.findUnique as any).mockResolvedValueOnce(otherUserOrder);

            // Act
            const result = await getOrderById(1, mockAdminUser);

            // Assert
            expect(result).toEqual(otherUserOrder);
        });

        it('deve incluir items e products ao buscar', async () => {
            // Arrange
            (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);

            // Act
            await getOrderById(1, mockAuthUser);

            // Assert
            expect(prisma.order.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.objectContaining({
                        items: expect.objectContaining({
                            include: { product: true },
                        }),
                    }),
                })
            );
        });
    });

    describe('createOrder', () => {
        it('deve criar novo pedido com sucesso', async () => {
            // Arrange
            const createPayload: CreateOrder = {
                items: [{ productId: 1, quantity: 2 }],
                paymentMethod: 'CARD',
                shippingAddress: mockShippingAddress,
            };

            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockImplementationOnce(async (callback) => {
                const tx = {
                    product: {
                        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
                    },
                    order: {
                        create: vi.fn().mockResolvedValueOnce(mockOrder),
                    },
                };

                return callback(tx);
            });

            // Act
            const result = await createOrder(createPayload, mockAuthUser.id);

            // Assert
            expect(result).toEqual(mockOrder);
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        });

        it('deve calcular total corretamente', async () => {
            // Arrange
            const createPayload: CreateOrder = {
                items: [{ productId: 1, quantity: 2 }],
                paymentMethod: 'CARD',
                shippingAddress: mockShippingAddress,
            };

            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockImplementationOnce(async (callback) => {
                const tx = {
                    product: {
                        updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
                    },
                    order: {
                        create: vi.fn().mockResolvedValueOnce(mockOrder),
                    },
                };

                return callback(tx);
            });

            // Act
            await createOrder(createPayload, mockAuthUser.id);

            // Assert
            const transactionFn = (prisma.$transaction as any).mock.calls[0][0];
            const tx = {
                product: {
                    updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
                },
                order: {
                    create: vi.fn().mockResolvedValueOnce(mockOrder),
                },
            };

            await transactionFn(tx);
            const createCall = tx.order.create.mock.calls[0];
            expect(createCall[0].data.total).toEqual(new Prisma.Decimal('100.00'));
        });

        it('deve reservar estoque dentro da transação ao criar pedido', async () => {
            // Arrange
            const createPayload: CreateOrder = {
                items: [{ productId: 1, quantity: 2 }],
                paymentMethod: 'CARD',
                shippingAddress: mockShippingAddress,
            };

            const transactionOrder = {
                ...mockOrder,
                status: 'PENDING' as const,
            };

            const mockedTx = {
                product: {
                    updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
                },
                order: {
                    create: vi.fn().mockResolvedValueOnce(transactionOrder),
                },
            };

            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockImplementationOnce(async (callback) => callback(mockedTx));

            // Act
            const result = await createOrder(createPayload, mockAuthUser.id);

            // Assert
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
            expect(mockedTx.product.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ id: 1, stock: { gte: 2 } }),
                })
            );
            expect(result).toEqual(transactionOrder);
        });

        it('deve lançar erro se produto não encontrado', async () => {
            // Arrange
            const createPayload: CreateOrder = {
                items: [{ productId: 999, quantity: 2 }],
                paymentMethod: 'CARD',
                shippingAddress: mockShippingAddress,
            };

            (prisma.product.findMany as any).mockResolvedValueOnce([]);

            // Act & Assert
            await expect(createOrder(createPayload, mockAuthUser.id)).rejects.toThrow(
                'Produto nao encontrado ou inativo.'
            );
        });

        it('deve lançar erro se estoque insuficiente', async () => {
            // Arrange
            const createPayload: CreateOrder = {
                items: [{ productId: 1, quantity: 100 }],
                paymentMethod: 'CARD',
                shippingAddress: mockShippingAddress,
            };

            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);

            // Act & Assert
            await expect(createOrder(createPayload, mockAuthUser.id)).rejects.toThrow(
                'Estoque insuficiente para o produto selecionado.'
            );
        });

        it('não deve criar pedido se o estoque acabar antes da reserva transacional', async () => {
            const createPayload: CreateOrder = {
                items: [{ productId: 1, quantity: 2 }],
                paymentMethod: 'CARD',
                shippingAddress: mockShippingAddress,
            };
            const updateMany = vi.fn().mockResolvedValueOnce({ count: 0 });
            const create = vi.fn();

            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockImplementationOnce(async (callback) =>
                callback({
                    product: { updateMany },
                    order: { create },
                })
            );

            await expect(createOrder(createPayload, mockAuthUser.id)).rejects.toThrow(
                'Estoque insuficiente para o produto selecionado.'
            );

            expect(updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1, stock: { gte: 2 } },
                })
            );
            expect(create).not.toHaveBeenCalled();
        });
    });

    describe('updateOrderStatus', () => {
        it('deve retornar erro se usuário não é admin', async () => {
            // Arrange
            // Act & Assert
            await expect(
                updateOrderStatus(1, 'PAID', mockAuthUser)
            ).rejects.toThrow(ForbiddenError);
        });

        it('admin deve atualizar status do pedido', async () => {
            // Arrange
            const updatedOrder = { ...mockOrder, status: 'PAID' as const };
            const tx = {
                product: {
                    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                    update: vi.fn(),
                },
                order: {
                    update: vi.fn().mockResolvedValue(updatedOrder),
                },
            };
            (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);
            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockImplementationOnce(async (callback) => callback(tx));

            // Act
            const result = await updateOrderStatus(1, 'PAID', mockAdminUser);

            // Assert
            expect(result).toEqual(updatedOrder);
            expect(tx.product.updateMany).not.toHaveBeenCalled();
            expect(tx.product.update).not.toHaveBeenCalled();
        });

        it('deve reservar o estoque novamente ao reabrir um pedido cancelado', async () => {
            const cancelledOrder = { ...mockOrder, status: 'CANCELLED' as const };
            const reopenedOrder = { ...mockOrder, status: 'PAID' as const };
            const tx = {
                product: {
                    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                    update: vi.fn(),
                },
                order: {
                    update: vi.fn().mockResolvedValue(reopenedOrder),
                },
            };
            (prisma.order.findUnique as any).mockResolvedValueOnce(cancelledOrder);
            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockImplementationOnce(async (callback) => callback(tx));

            await updateOrderStatus(1, 'PAID', mockAdminUser);

            expect(tx.product.updateMany).toHaveBeenCalledWith({
                where: { id: 1, active: true, stock: { gte: 2 } },
                data: { stock: { decrement: 2 } },
            });
            expect(tx.product.update).not.toHaveBeenCalled();
        });

        it('deve lançar erro se pedido não encontrado', async () => {
            // Arrange
            (prisma.order.findUnique as any).mockResolvedValueOnce(null);

            // Act & Assert
            await expect(
                updateOrderStatus(999, 'PAID', mockAdminUser)
            ).rejects.toThrow(NotFoundError);
        });

        it('não deve atualizar se status é o mesmo', async () => {
            // Arrange
            const sameOrder = { ...mockOrder, status: 'PENDING' as const };
            (prisma.order.findUnique as any).mockResolvedValueOnce(sameOrder);
            (prisma.order.findUnique as any).mockResolvedValueOnce(sameOrder);

            // Act
            await updateOrderStatus(1, 'PENDING', mockAdminUser);

            // Assert
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });
    });

    describe('deleteOrder', () => {
        it('deve devolver ao estoque os itens de um pedido pendente cancelado', async () => {
            const tx = {
                product: {
                    update: vi.fn(),
                    updateMany: vi.fn(),
                },
                order: {
                    update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'CANCELLED' as const }),
                },
            };
            (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);
            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockImplementationOnce(async (callback) => callback(tx));

            await deleteOrder(1, mockAuthUser);

            expect(tx.product.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { stock: { increment: 2 } },
            });
            expect(tx.product.updateMany).not.toHaveBeenCalled();
        });

        it('deve cancelar pedido com sucesso', async () => {
            // Arrange
            (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);
            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockResolvedValueOnce({
                ...mockOrder,
                status: 'CANCELLED' as const,
            });

            // Act
            await deleteOrder(1, mockAuthUser);

            // Assert
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('deve lançar erro se pedido não encontrado', async () => {
            // Arrange
            (prisma.order.findUnique as any).mockResolvedValueOnce(null);

            // Act & Assert
            await expect(deleteOrder(999, mockAuthUser)).rejects.toThrow(NotFoundError);
        });

        it('deve lançar erro se usuário não é dono do pedido', async () => {
            // Arrange
            const otherUserOrder = { ...mockOrder, userId: 999 };
            (prisma.order.findUnique as any).mockResolvedValueOnce(otherUserOrder);

            // Act & Assert
            await expect(deleteOrder(1, mockAuthUser)).rejects.toThrow();
        });

        it('deve permitir que admin cancele pedido de outro usuário', async () => {
            // Arrange
            const otherUserOrder = { ...mockOrder, userId: 999 };
            (prisma.order.findUnique as any).mockResolvedValueOnce(otherUserOrder);
            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            (prisma.$transaction as any).mockResolvedValueOnce({
                ...otherUserOrder,
                status: 'CANCELLED' as const,
            });

            // Act
            await expect(deleteOrder(1, mockAdminUser)).resolves.toBeUndefined();

            // Assert
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('deve mudar status para CANCELLED', async () => {
            // Arrange
            (prisma.order.findUnique as any).mockResolvedValueOnce(mockOrder);
            (prisma.product.findMany as any).mockResolvedValueOnce([mockProduct]);
            const cancelledOrder = { ...mockOrder, status: 'CANCELLED' as const };
            (prisma.$transaction as any).mockResolvedValueOnce(cancelledOrder);

            // Act
            await deleteOrder(1, mockAuthUser);

            // Assert
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
