import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
    listCategories,
    getCategory,
    createNewCategory,
    updateExistingCategory,
    deleteExistingCategory,
} from '../../src/controllers/categories.controller';
import * as categoryService from '../../src/services/category.services';

// Mock do service
vi.mock('../../src/services/category.services');
vi.mock('slugify', () => ({
    default: (text: string) => text.toLowerCase().replace(/\s+/g, '-'),
}));
vi.mock('../../src/utils/validator', () => ({
    categoryIdSchema: { parse: vi.fn((v) => ({ ...v, id: Number(v.id) })) },
    createCategorySchema: { parse: vi.fn((v) => v) },
    updateCategorySchema: { parse: vi.fn((v) => v) },
}));

describe('Categories Controller', () => {
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
    describe('listCategories', () => {
        it('deve listar categorias com sucesso (200)', async () => {
            // Arrange
            const mockCategories = [
                {
                    id: 1,
                    name: 'Camisetas',
                    slug: 'camisetas',
                    description: 'Camisetas variadas',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    name: 'Calças',
                    slug: 'calcas',
                    description: 'Calças jeans',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            vi.mocked(categoryService.listCategories).mockResolvedValue(
                mockCategories as any
            );

            // Act
            await listCategories(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockCategories);
        });

        it('deve retornar lista vazia quando não há categorias', async () => {
            // Arrange
            vi.mocked(categoryService.listCategories).mockResolvedValue([]);

            // Act
            await listCategories(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith([]);
        });
    });

    // ========== TESTES DE BUSCA POR ID ==========
    describe('getCategory', () => {
        it('deve retornar categoria por ID (200)', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            const mockCategory = {
                id: 1,
                name: 'Camisetas',
                slug: 'camisetas',
                description: 'Camisetas variadas',
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(categoryService.getCategoryById).mockResolvedValue(
                mockCategory as any
            );

            // Act
            await getCategory(
                mockRequest as FastifyRequest<{ Params: { id: string } }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockCategory);
            expect(categoryService.getCategoryById).toHaveBeenCalledWith(1);
        });

        it('deve retornar erro 404 quando categoria não existe', async () => {
            // Arrange
            mockRequest.params = { id: '999' };
            vi.mocked(categoryService.getCategoryById).mockRejectedValue(
                new Error('Categoria nao encontrada.')
            );

            // Act & Assert
            await expect(
                getCategory(
                    mockRequest as FastifyRequest<{ Params: { id: string } }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Categoria nao encontrada.');
        });

        it('deve retornar erro 400 para ID inválido', async () => {
            // Arrange
            mockRequest.params = { id: 'invalido' };

            // Act & Assert
            await expect(
                getCategory(
                    mockRequest as FastifyRequest<{ Params: { id: string } }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow();
        });
    });

    // ========== TESTES DE CRIAÇÃO ==========
    describe('createNewCategory', () => {
        it('deve criar categoria com sucesso (201)', async () => {
            // Arrange
            mockRequest.body = {
                name: 'Camisetas',
                description: 'Camisetas de qualidade',
            };

            // Act
            await createNewCategory(
                mockRequest as FastifyRequest<{ Body: any }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({
                message: 'Categoria criada com sucesso.',
            });
        });

        it('deve retornar erro 401 quando não autenticado', async () => {
            // Arrange
            mockRequest.authUser = null;
            mockRequest.body = {
                name: 'Camisetas',
            };

            // Act
            await createNewCategory(
                mockRequest as FastifyRequest<{ Body: any }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Nao autenticado.',
            });
        });

        it('deve retornar erro 403 quando não é admin', async () => {
            // Arrange
            mockRequest.authUser = {
                id: 1,
                role: 'USER',
            };
            mockRequest.body = {
                name: 'Camisetas',
            };

            // Act
            await createNewCategory(
                mockRequest as FastifyRequest<{ Body: any }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(403);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Acesso negado.',
            });
        });

        it('deve retornar erro 409 quando slug já existe', async () => {
            // Arrange
            mockRequest.body = {
                name: 'Camisetas',
                description: 'Camisetas de qualidade',
            };

            vi.mocked(categoryService.createCategory).mockRejectedValue(
                new Error('Ja existe uma categoria com este slug.')
            );

            // Act & Assert
            await expect(
                createNewCategory(
                    mockRequest as FastifyRequest<{ Body: any }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Ja existe uma categoria com este slug.');
        });
    });

    // ========== TESTES DE ATUALIZAÇÃO ==========
    describe('updateExistingCategory', () => {
        it('deve atualizar categoria com sucesso (200)', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                name: 'Camisetas Premium',
            };

            const updatedCategory = {
                id: 1,
                name: 'Camisetas Premium',
                slug: 'camisetas-premium',
                description: 'Camisetas de qualidade',
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(categoryService.updateCategory).mockResolvedValue(
                updatedCategory as any
            );

            // Act
            await updateExistingCategory(
                mockRequest as FastifyRequest<{
                    Params: { id: string };
                    Body: any;
                }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Camisetas Premium',
                })
            );
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
            await updateExistingCategory(
                mockRequest as FastifyRequest<{
                    Params: { id: string };
                    Body: any;
                }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(403);
        });

        it('deve retornar erro 404 quando categoria não existe', async () => {
            // Arrange
            mockRequest.params = { id: '999' };
            mockRequest.body = { name: 'Novo Nome' };

            vi.mocked(categoryService.updateCategory).mockRejectedValue(
                new Error('Categoria nao encontrada.')
            );

            // Act & Assert
            await expect(
                updateExistingCategory(
                    mockRequest as FastifyRequest<{
                        Params: { id: string };
                        Body: any;
                    }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Categoria nao encontrada.');
        });
    });

    // ========== TESTES DE DELEÇÃO ==========
    describe('deleteExistingCategory', () => {
        it('deve deletar categoria com sucesso (204)', async () => {
            // Arrange
            mockRequest.params = { id: '1' };

            vi.mocked(categoryService.deleteCategory).mockResolvedValue(
                undefined
            );

            // Act
            await deleteExistingCategory(
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
            await deleteExistingCategory(
                mockRequest as FastifyRequest<{ Params: { id: string } }>,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(403);
        });

        it('deve retornar erro 404 quando categoria não existe', async () => {
            // Arrange
            mockRequest.params = { id: '999' };

            vi.mocked(categoryService.deleteCategory).mockRejectedValue(
                new Error('Categoria nao encontrada.')
            );

            // Act & Assert
            await expect(
                deleteExistingCategory(
                    mockRequest as FastifyRequest<{ Params: { id: string } }>,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Categoria nao encontrada.');
        });
    });
});
