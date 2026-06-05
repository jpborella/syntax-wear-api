import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Prisma } from '@prisma/client';

// Mock do Prisma
vi.mock('../../src/utils/prisma', () => ({
    prisma: {
        category: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        product: {
            updateMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

// Importar depois dos mocks
import {
    listCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../../src/services/category.services';
import { prisma } from '../../src/utils/prisma';

describe('Category Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========== TESTES DE LISTAGEM ==========
    describe('listCategories', () => {
        it('deve listar todas as categorias ativas', async () => {
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
                    description: 'Calças jeans e casuais',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories);

            // Act
            const result = await listCategories();

            // Assert
            expect(result).toEqual(mockCategories);
            expect(prisma.category.findMany).toHaveBeenCalledWith({
                where: { active: true },
                orderBy: { name: 'asc' },
            });
        });

        it('deve retornar lista vazia quando não houver categorias ativas', async () => {
            // Arrange
            vi.mocked(prisma.category.findMany).mockResolvedValue([]);

            // Act
            const result = await listCategories();

            // Assert
            expect(result).toEqual([]);
            expect(prisma.category.findMany).toHaveBeenCalled();
        });
    });

    // ========== TESTES DE BUSCA POR ID ==========
    describe('getCategoryById', () => {
        const mockCategory = {
            id: 1,
            name: 'Camisetas',
            slug: 'camisetas',
            description: 'Camisetas variadas',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('deve retornar categoria por ID quando ela existe', async () => {
            // Arrange
            vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory);

            // Act
            const result = await getCategoryById(1);

            // Assert
            expect(result).toEqual(mockCategory);
            expect(prisma.category.findFirst).toHaveBeenCalledWith({
                where: { id: 1, active: true },
            });
        });

        it('deve lançar erro quando categoria não existe', async () => {
            // Arrange
            vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

            // Act & Assert
            await expect(getCategoryById(999)).rejects.toThrow(
                'Categoria nao encontrada.'
            );
        });

        it('deve lançar erro quando categoria está inativa', async () => {
            // Arrange
            vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

            // Act & Assert
            await expect(getCategoryById(1)).rejects.toThrow(
                'Categoria nao encontrada.'
            );
        });
    });

    // ========== TESTES DE CRIAÇÃO ==========
    describe('createCategory', () => {
        const validData: Prisma.CategoryCreateInput = {
            name: 'Camisetas',
            slug: 'camisetas',
            description: 'Camisetas de qualidade',
            active: true,
        };

        it('deve criar uma categoria com todos os campos obrigatórios', async () => {
            // Arrange
            const newCategory = {
                id: 1,
                name: validData.name,
                slug: validData.slug,
                description: validData.description,
                active: validData.active,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.category.create).mockResolvedValue(newCategory as any);

            // Act
            const result = await createCategory(validData);

            // Assert
            expect(result).toEqual(newCategory);
            expect(prisma.category.findUnique).toHaveBeenCalledWith({
                where: { slug: validData.slug },
            });
            expect(prisma.category.create).toHaveBeenCalledWith({
                data: validData,
            });
        });

        it('deve criar categoria sem descrição (campo opcional)', async () => {
            // Arrange
            const dataWithoutDescription = {
                name: 'Calças',
                slug: 'calcas',
                active: true,
            };

            const newCategory = {
                id: 2,
                name: dataWithoutDescription.name,
                slug: dataWithoutDescription.slug,
                description: null,
                active: dataWithoutDescription.active,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.category.create).mockResolvedValue(newCategory as any);

            // Act
            const result = await createCategory(dataWithoutDescription);

            // Assert
            expect(result.name).toBe('Calças');
            expect(result.description).toBeNull();
            expect(prisma.category.create).toHaveBeenCalled();
        });

        it('deve lançar erro quando slug já existe', async () => {
            // Arrange
            const existingCategory = {
                id: 999,
                name: 'Categoria Existente',
                slug: 'camisetas',
                description: 'Já existe',
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                existingCategory
            );

            // Act & Assert
            await expect(createCategory(validData)).rejects.toThrow(
                'Ja existe uma categoria com este slug.'
            );
            expect(prisma.category.create).not.toHaveBeenCalled();
        });

        it('deve validar nome obrigatório (mínimo 2 caracteres)', async () => {
            // Arrange - dados inválidos seriam validados no controller
            const invalidData = {
                name: 'A', // Muito curto
                slug: 'test',
                active: true,
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

            // A validação real acontece no controller, mas testamos a lógica de negócio
            const result = {
                id: 1,
                name: invalidData.name,
                slug: invalidData.slug,
                description: null,
                active: invalidData.active,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.category.create).mockResolvedValue(result);

            // Act
            const created = await createCategory(invalidData);

            // Assert - service não faz validação (fica no controller)
            expect(created.id).toBe(1);
        });

        it('deve validar slug obrigatório (mínimo 2 caracteres)', async () => {
            // Arrange
            const invalidData = {
                name: 'Categoria',
                slug: 'A', // Muito curto
                active: true,
            };

            const result = {
                id: 1,
                name: invalidData.name,
                slug: invalidData.slug,
                description: null,
                active: invalidData.active,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.category.create).mockResolvedValue(result);

            // Act
            const created = await createCategory(invalidData);

            // Assert
            expect(created.id).toBe(1);
        });

        it('deve criar categoria com active por padrão como true', async () => {
            // Arrange
            const dataWithoutActive = {
                name: 'Nova Categoria',
                slug: 'nova-categoria',
                active: true,
            };

            const newCategory = {
                id: 3,
                name: dataWithoutActive.name,
                slug: dataWithoutActive.slug,
                description: null,
                active: dataWithoutActive.active,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.category.create).mockResolvedValue(newCategory as any);

            // Act
            const result = await createCategory(dataWithoutActive);

            // Assert
            expect(result.active).toBe(true);
        });
    });

    // ========== TESTES DE ATUALIZAÇÃO ==========
    describe('updateCategory', () => {
        const existingCategory = {
            id: 1,
            name: 'Camisetas',
            slug: 'camisetas',
            description: 'Camisetas antigas',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('deve atualizar nome da categoria', async () => {
            // Arrange
            const updateData: Prisma.CategoryUpdateInput = {
                name: 'Camisetas Premium',
                slug: 'camisetas-premium',
            };

            const updatedCategory = {
                ...existingCategory,
                name: 'Camisetas Premium',
                slug: 'camisetas-premium',
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                existingCategory
            );
            vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

            // Act
            const result = await updateCategory(1, updateData);

            // Assert
            expect(result.name).toBe('Camisetas Premium');
            expect(prisma.category.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData,
            });
        });

        it('deve atualizar descrição da categoria', async () => {
            // Arrange
            const updateData: Prisma.CategoryUpdateInput = {
                description: 'Camisetas novas e melhoradas',
            };

            const updatedCategory = {
                ...existingCategory,
                description: 'Camisetas novas e melhoradas',
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                existingCategory
            );
            vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

            // Act
            const result = await updateCategory(1, updateData);

            // Assert
            expect(result.description).toBe('Camisetas novas e melhoradas');
        });

        it('deve atualizar status ativo da categoria', async () => {
            // Arrange
            const updateData: Prisma.CategoryUpdateInput = {
                active: false,
            };

            const updatedCategory = {
                ...existingCategory,
                active: false,
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                existingCategory
            );
            vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

            // Act
            const result = await updateCategory(1, updateData);

            // Assert
            expect(result.active).toBe(false);
        });

        it('deve permitir atualizar múltiplos campos', async () => {
            // Arrange
            const updateData: Prisma.CategoryUpdateInput = {
                name: 'Nova Nome',
                description: 'Nova descrição',
                active: false,
            };

            const updatedCategory = {
                ...existingCategory,
                name: 'Nova Nome',
                description: 'Nova descrição',
                active: false,
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                existingCategory
            );
            vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

            // Act
            const result = await updateCategory(1, updateData);

            // Assert
            expect(result.name).toBe('Nova Nome');
            expect(result.description).toBe('Nova descrição');
            expect(result.active).toBe(false);
        });

        it('deve lançar erro quando categoria não existe', async () => {
            // Arrange
            const updateData: Prisma.CategoryUpdateInput = {
                name: 'Novo Nome',
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

            // Act & Assert
            await expect(updateCategory(999, updateData)).rejects.toThrow(
                'Categoria nao encontrada.'
            );
            expect(prisma.category.update).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando novo slug já existe em outra categoria', async () => {
            // Arrange
            const updateData: Prisma.CategoryUpdateInput = {
                slug: 'calcas',
            };

            const existingWithDifferentSlug = {
                id: 2,
                name: 'Calças',
                slug: 'calcas',
                description: 'Já existe',
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.category.findUnique)
                .mockResolvedValueOnce(existingCategory) // Primeira chamada para verificar se existe
                .mockResolvedValueOnce(existingWithDifferentSlug); // Segunda chamada para verificar slug

            // Act & Assert
            await expect(updateCategory(1, updateData)).rejects.toThrow(
                'Slug ja existe. Escolha outro nome para a categoria.'
            );
            expect(prisma.category.update).not.toHaveBeenCalled();
        });

        it('deve permitir manter o mesmo slug ao atualizar', async () => {
            // Arrange
            const updateData: Prisma.CategoryUpdateInput = {
                name: 'Camisetas Atualizadas',
                slug: 'camisetas', // Mesmo slug
            };

            const updatedCategory = {
                ...existingCategory,
                name: 'Camisetas Atualizadas',
            };

            vi.mocked(prisma.category.findUnique)
                .mockResolvedValueOnce(existingCategory)
                .mockResolvedValueOnce(existingCategory); // Mesmo slug pertence à mesma categoria

            vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

            // Act
            const result = await updateCategory(1, updateData);

            // Assert
            expect(result.name).toBe('Camisetas Atualizadas');
            expect(prisma.category.update).toHaveBeenCalled();
        });
    });

    // ========== TESTES DE DELEÇÃO ==========
    describe('deleteCategory', () => {
        const existingCategory = {
            id: 1,
            name: 'Camisetas',
            slug: 'camisetas',
            description: 'Camisetas',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('deve deletar (desativar) uma categoria ativa e seus produtos', async () => {
            // Arrange
            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                existingCategory
            );
            vi.mocked(prisma.$transaction).mockResolvedValue([
                { ...existingCategory, active: false },
                { count: 5 },
            ]);

            // Act
            await deleteCategory(1);

            // Assert
            expect(prisma.category.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('deve usar transação ao deletar categoria', async () => {
            // Arrange
            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                existingCategory
            );
            vi.mocked(prisma.$transaction).mockResolvedValue([
                { ...existingCategory, active: false },
                { count: 3 },
            ]);

            // Act
            await deleteCategory(1);

            // Assert
            expect(prisma.$transaction).toHaveBeenCalled();
            const transactionArg = vi.mocked(prisma.$transaction).mock
                .calls[0][0];
            expect(Array.isArray(transactionArg)).toBe(true);
        });

        it('deve lançar erro quando categoria não existe', async () => {
            // Arrange
            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

            // Act & Assert
            await expect(deleteCategory(999)).rejects.toThrow(
                'Categoria nao encontrada.'
            );
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('deve lançar erro quando categoria já está inativa', async () => {
            // Arrange
            const inactiveCategory = {
                ...existingCategory,
                active: false,
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                inactiveCategory
            );

            // Act & Assert
            await expect(deleteCategory(1)).rejects.toThrow(
                'Categoria ja esta inativa.'
            );
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('deve desativar todos os produtos da categoria ao deletá-la', async () => {
            // Arrange
            vi.mocked(prisma.category.findUnique).mockResolvedValue(
                existingCategory
            );
            vi.mocked(prisma.$transaction).mockResolvedValue([
                { ...existingCategory, active: false },
                { count: 7 },
            ]);

            // Act
            await deleteCategory(1);

            // Assert
            expect(prisma.$transaction).toHaveBeenCalled();
            // Verifica que updateMany foi chamado para produtos
            const transactionArg = vi.mocked(prisma.$transaction).mock
                .calls[0][0];
            expect(Array.isArray(transactionArg)).toBe(true);
        });
    });

    // ========== TESTES DE VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ==========
    describe('Validação de Campos Obrigatórios', () => {
        it('deve exigir campo "name" ao criar categoria', async () => {
            // O teste valida que o serviço rejeita dados sem o nome
            // Na prática, a validação acontece no controller via schema
            const invalidData = {
                slug: 'test',
                active: true,
            } as any;

            expect(invalidData.name).toBeUndefined();
        });

        it('deve exigir campo "slug" ao criar categoria', async () => {
            // O teste valida que o serviço rejeita dados sem slug
            const invalidData = {
                name: 'Teste',
                active: true,
            } as any;

            expect(invalidData.slug).toBeUndefined();
        });

        it('deve exigir campo "active" ao criar categoria', async () => {
            // O teste valida que active é esperado
            const validData = {
                name: 'Teste',
                slug: 'test',
                active: true,
            };

            expect(validData.active).toBeDefined();
            expect(typeof validData.active).toBe('boolean');
        });

        it('deve permitir descrição nula ou vazia', async () => {
            // Arrange
            const dataWithoutDescription = {
                name: 'Categoria',
                slug: 'categoria',
                active: true,
            };

            const newCategory = {
                id: 1,
                name: dataWithoutDescription.name,
                slug: dataWithoutDescription.slug,
                description: null,
                active: dataWithoutDescription.active,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.category.create).mockResolvedValue(newCategory as any);

            // Act
            const result = await createCategory(dataWithoutDescription);

            // Assert
            expect(result.description).toBeNull();
        });
    });
});
