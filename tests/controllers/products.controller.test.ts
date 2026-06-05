import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
    listProducts,
    getProduct,
    createNewProduct,
    updateExistingProduct,
    deleteExistingProduct,
} from '../../src/controllers/products.controller';
import * as productService from '../../src/services/product.services';

// Mock do service
vi.mock('../../src/services/product.services');
vi.mock('slugify', () => ({
    default: (text: string) => text.toLowerCase().replace(/\s+/g, '-'),
}));
vi.mock('../../src/utils/validator', () => ({
    productIdSchema: { parse: vi.fn((v) => v) },
    createProductSchema: { parse: vi.fn((v) => v) },
    updateProductSchema: { parse: vi.fn((v) => v) },
    productFiltersSchema: { parse: vi.fn((v) => v) },
}));

describe('Products Controller', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
            authUser: {
                id: 1,
                role: 'ADMIN',
            },
        };
        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
        vi.clearAllMocks();
    });

    // ========== TESTES DE LISTAGEM ==========
    describe('listProducts', () => {
        it('deve listar produtos com paginação padrão (200)', async () => {
            // Arrange
            mockRequest.query = { page: '1', limit: '10' };

            const mockResponse = {
                data: [
                    {
                        id: 1,
                        name: 'Camiseta Azul',
                        slug: 'camiseta-azul',
                        price: 49.99,
                        stock: 10,
                        categoryId: 1,
                        createdAt: new Date(),
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };

            vi.mocked(productService.getProducts).mockResolvedValue(
                mockResponse as any
            );

            // Act
            await listProducts(
                mockRequest as FastifyRequest<{ Querystring: any }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockResponse);
        });

        it('deve filtrar produtos por preço', async () => {
            // Arrange
            mockRequest.query = {
                page: '1',
                limit: '10',
                minPrice: '40',
                maxPrice: '60',
            };

            vi.mocked(productService.getProducts).mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            } as any);

            // Act
            await listProducts(
                mockRequest as FastifyRequest<{ Querystring: any }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(productService.getProducts).toHaveBeenCalled();
        });

        it('deve ordenar produtos por preço descendente', async () => {
            // Arrange
            mockRequest.query = {
                page: '1',
                limit: '10',
                sortBy: 'price',
                sortOrder: 'desc',
            };

            vi.mocked(productService.getProducts).mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            } as any);

            // Act
            await listProducts(
                mockRequest as FastifyRequest<{ Querystring: any }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
        });
    });

    // ========== TESTES DE BUSCA POR ID ==========
    describe('getProduct', () => {
        it('deve retornar produto por ID (200)', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            const mockProduct = {
                id: 1,
                name: 'Camiseta Azul',
                slug: 'camiseta-azul',
                price: 49.99,
                description: 'Camiseta de qualidade',
                stock: 10,
                active: true,
                categoryId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(productService.getProductById).mockResolvedValue(
                mockProduct as any
            );

            // Act
            await getProduct(
                mockRequest as FastifyRequest<{ Params: { id: string } }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockProduct);
        });

        it('deve retornar erro 404 quando produto não existe', async () => {
            // Arrange
            mockRequest.params = { id: '999' };
            vi.mocked(productService.getProductById).mockRejectedValue(
                new Error('Produto não encontrado.')
            );

            // Act & Assert
            await expect(
                getProduct(
                    mockRequest as FastifyRequest<{ Params: { id: string } }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Produto não encontrado.');
        });
    });

    // ========== TESTES DE CRIAÇÃO ==========
    describe('createNewProduct', () => {
        const validPayload = {
            name: 'Camiseta Nova',
            price: 49.99,
            description: 'Uma camiseta nova',
            categoryId: 1,
            stock: 10,
            images: ['img.jpg'],
            colors: ['azul'],
            sizes: ['M'],
        };

        it('deve criar produto com sucesso (201)', async () => {
            // Arrange
            mockRequest.body = validPayload;

            const mockProduct = {
                id: 1,
                name: validPayload.name,
                price: validPayload.price,
                description: validPayload.description,
                categoryId: validPayload.categoryId,
                stock: validPayload.stock,
                slug: 'camiseta-nova',
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(productService.createProduct).mockResolvedValue(
                mockProduct as any
            );

            // Act
            await createNewProduct(
                mockRequest as FastifyRequest<{ Body: any }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({
                message: 'Produto criado com sucesso.',
            });
        });

        it('deve retornar erro 403 quando não é admin', async () => {
            // Arrange
            mockRequest.authUser = {
                id: 1,
                role: 'USER',
            };
            mockRequest.body = validPayload;

            // Act
            await createNewProduct(
                mockRequest as FastifyRequest<{ Body: any }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(403);
        });

        it('deve retornar erro 404 quando categoria não existe', async () => {
            // Arrange
            mockRequest.body = validPayload;

            vi.mocked(productService.createProduct).mockRejectedValue(
                new Error('Categoria não encontrada ou inativa.')
            );

            // Act & Assert
            await expect(
                createNewProduct(
                    mockRequest as FastifyRequest<{ Body: any }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Categoria não encontrada ou inativa.');
        });

        it('deve retornar erro 409 quando slug já existe', async () => {
            // Arrange
            mockRequest.body = validPayload;

            vi.mocked(productService.createProduct).mockRejectedValue(
                new Error('Já existe um produto com este slug.')
            );

            // Act & Assert
            await expect(
                createNewProduct(
                    mockRequest as FastifyRequest<{ Body: any }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Já existe um produto com este slug.');
        });
    });

    // ========== TESTES DE ATUALIZAÇÃO ==========
    describe('updateExistingProduct', () => {
        it('deve atualizar produto com sucesso (200)', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                name: 'Camiseta Premium',
                price: 59.99,
            };

            const updatedProduct = {
                id: 1,
                name: 'Camiseta Premium',
                slug: 'camiseta-premium',
                price: 59.99,
                description: 'Camiseta de qualidade',
                stock: 10,
                active: true,
                categoryId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(productService.updateProduct).mockResolvedValue(
                updatedProduct as any
            );

            // Act
            await updateExistingProduct(
                mockRequest as FastifyRequest<{
                    Params: { id: string };
                    Body: any;
                }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(updatedProduct);
        });

        it('deve retornar erro 403 quando não é admin', async () => {
            // Arrange
            mockRequest.authUser = {
                id: 1,
                role: 'USER',
            };
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Novo Nome' };

            // Act
            await updateExistingProduct(
                mockRequest as FastifyRequest<{
                    Params: { id: string };
                    Body: any;
                }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(403);
        });

        it('deve retornar erro 404 quando produto não existe', async () => {
            // Arrange
            mockRequest.params = { id: '999' };
            mockRequest.body = { name: 'Novo Nome' };

            vi.mocked(productService.updateProduct).mockRejectedValue(
                new Error('Produto não encontrado.')
            );

            // Act & Assert
            await expect(
                updateExistingProduct(
                    mockRequest as FastifyRequest<{
                        Params: { id: string };
                        Body: any;
                    }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Produto não encontrado.');
        });
    });

    // ========== TESTES DE DELEÇÃO ==========
    describe('deleteExistingProduct', () => {
        it('deve deletar produto com sucesso (204)', async () => {
            // Arrange
            mockRequest.params = { id: '1' };

            vi.mocked(productService.deleteProduct).mockResolvedValue(
                undefined
            );

            // Act
            await deleteExistingProduct(
                mockRequest as FastifyRequest<{ Params: { id: string } }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalled();
        });

        it('deve retornar erro 403 quando não é admin', async () => {
            // Arrange
            mockRequest.authUser = {
                id: 1,
                role: 'USER',
            };
            mockRequest.params = { id: '1' };

            // Act
            await deleteExistingProduct(
                mockRequest as FastifyRequest<{ Params: { id: string } }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(403);
        });

        it('deve retornar erro 404 quando produto não existe', async () => {
            // Arrange
            mockRequest.params = { id: '999' };

            vi.mocked(productService.deleteProduct).mockRejectedValue(
                new Error('Produto não encontrado.')
            );

            // Act & Assert
            await expect(
                deleteExistingProduct(
                    mockRequest as FastifyRequest<{ Params: { id: string } }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Produto não encontrado.');
        });
    });
});
