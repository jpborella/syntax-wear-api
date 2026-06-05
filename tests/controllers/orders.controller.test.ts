import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    listOrdersHandler,
    getOrderHandler,
    createOrderHandler,
    updateOrderHandler,
    deleteOrderHandler,
} from '../../src/controllers/orders.controller';
import * as orderServices from '../../src/services/order.services';
import { AuthenticatedUser, ShippingAddress } from '../../src/types';

// Mock dos serviços
vi.mock('../../src/services/order.services', () => ({
    listOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    deleteOrder: vi.fn(),
}));

// Mock do validator
vi.mock('../../src/utils/validator', () => ({
    createOrderSchema: {
        parse: vi.fn((v) => v),
    },
    orderFiltersSchema: {
        parse: vi.fn((v) => v),
    },
    orderIdSchema: {
        parse: vi.fn((v) => ({ ...v, id: Number(v.id) })),
    },
    updateOrderSchema: {
        parse: vi.fn((v) => v),
    },
}));

describe('Orders Controller', () => {
    let mockRequest: any;
    let mockReply: any;

    const mockAuthUser: AuthenticatedUser = {
        id: 1,
        role: 'USER',
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
        total: 100,
        status: 'PENDING',
        paymentMethod: 'CARD',
        shippingAddress: mockShippingAddress,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRequest = {
            authUser: mockAuthUser,
            query: {},
            params: {},
            body: {},
        };

        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('listOrdersHandler', () => {
        it('deve retornar erro 401 se não autenticado', async () => {
            // Arrange
            mockRequest.authUser = undefined;

            // Act
            await listOrdersHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Nao autenticado.' });
        });

        it('deve listar pedidos com filtros', async () => {
            // Arrange
            mockRequest.query = { page: 1, limit: 10, status: 'PENDING' };
            const mockOrders = {
                data: [mockOrder],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };
            (orderServices.listOrders as any).mockResolvedValueOnce(mockOrders);

            // Act
            await listOrdersHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockOrders);
            expect(orderServices.listOrders).toHaveBeenCalledWith(
                { page: 1, limit: 10, status: 'PENDING' },
                mockAuthUser
            );
        });
    });

    describe('getOrderHandler', () => {
        it('deve retornar erro 401 se não autenticado', async () => {
            // Arrange
            mockRequest.authUser = undefined;
            mockRequest.params = { id: '1' };

            // Act
            await getOrderHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Nao autenticado.' });
        });

        it('deve retornar pedido por ID', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            (orderServices.getOrderById as any).mockResolvedValueOnce(mockOrder);

            // Act
            await getOrderHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockOrder);
            expect(orderServices.getOrderById).toHaveBeenCalledWith(1, mockAuthUser);
        });
    });

    describe('createOrderHandler', () => {
        it('deve retornar erro 401 se não autenticado', async () => {
            // Arrange
            mockRequest.authUser = undefined;
            mockRequest.body = { items: [], paymentMethod: 'CARD', shippingAddress: mockShippingAddress };

            // Act
            await createOrderHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Nao autenticado.' });
        });

        it('deve criar novo pedido com sucesso', async () => {
            // Arrange
            mockRequest.body = {
                items: [{ productId: 1, quantity: 2 }],
                paymentMethod: 'CARD',
                shippingAddress: mockShippingAddress,
            };
            (orderServices.createOrder as any).mockResolvedValueOnce(mockOrder);

            // Act
            await createOrderHandler(mockRequest, mockReply);

            // Assert
            expect(orderServices.createOrder).toHaveBeenCalledWith(
                mockRequest.body,
                mockAuthUser.id
            );
        });
    });

    describe('updateOrderHandler', () => {
        it('deve retornar erro 401 se não autenticado', async () => {
            // Arrange
            mockRequest.authUser = undefined;
            mockRequest.params = { id: '1' };
            mockRequest.body = { status: 'PAID' };

            // Act
            await updateOrderHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Nao autenticado.' });
        });

        it('deve atualizar status do pedido com sucesso', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            mockRequest.body = { status: 'PAID' };
            const updatedOrder = { ...mockOrder, status: 'PAID' };
            (orderServices.updateOrderStatus as any).mockResolvedValueOnce(updatedOrder);

            // Act
            await updateOrderHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(updatedOrder);
            expect(orderServices.updateOrderStatus).toHaveBeenCalledWith(1, 'PAID', mockAuthUser);
        });
    });

    describe('deleteOrderHandler', () => {
        it('deve retornar erro 401 se não autenticado', async () => {
            // Arrange
            mockRequest.authUser = undefined;
            mockRequest.params = { id: '1' };

            // Act
            await deleteOrderHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Nao autenticado.' });
        });

        it('deve deletar pedido com sucesso', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            (orderServices.deleteOrder as any).mockResolvedValueOnce(undefined);

            // Act
            await deleteOrderHandler(mockRequest, mockReply);

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({
                message: 'Pedido cancelado com sucesso.',
            });
            expect(orderServices.deleteOrder).toHaveBeenCalledWith(1, mockAuthUser);
        });
    });
});
