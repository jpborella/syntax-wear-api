import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../src/services/product.services';
import { NotFoundError } from '../../src/types';

// Mock do Prisma
vi.mock('../../src/utils/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../../src/utils/prisma';

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== TESTES DE LISTAGEM ==========
  describe('getProducts', () => {
    it('deve listar produtos com sucesso', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          name: 'Camiseta Azul',
          slug: 'camiseta-azul',
          price: 49.99,
          images: ['img1.jpg'],
          stock: 10,
          categoryId: 1,
          createdAt: new Date(),
        },
        {
          id: 2,
          name: 'Camiseta Vermelha',
          slug: 'camiseta-vermelha',
          price: 59.99,
          images: ['img2.jpg'],
          stock: 5,
          categoryId: 1,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
      vi.mocked(prisma.product.count).mockResolvedValue(2);

      // Act
      const result = await getProducts({ page: 1, limit: 10 });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('deve filtrar produtos por preço mínimo e máximo', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          name: 'Camiseta',
          slug: 'camiseta',
          price: 49.99,
          images: [],
          stock: 10,
          categoryId: 1,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      // Act
      const result = await getProducts({
        page: 1,
        limit: 10,
        minPrice: 40,
        maxPrice: 60,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: expect.objectContaining({
              gte: 40,
              lte: 60,
            }),
          }),
        })
      );
    });

    it('deve buscar produtos por search', async () => {
      // Arrange
      const mockProducts = [
        {
          id: 1,
          name: 'Camiseta Azul',
          slug: 'camiseta-azul',
          price: 49.99,
          images: [],
          stock: 10,
          categoryId: 1,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      // Act
      await getProducts({ page: 1, limit: 10, search: 'Azul' });

      // Assert
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({
                  contains: 'Azul',
                }),
              }),
            ]),
          }),
        })
      );
    });

    it('deve ordenar produtos corretamente', async () => {
      // Arrange
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      // Act
      await getProducts({
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'desc',
      });

      // Assert
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({
            price: 'desc',
          }),
        })
      );
    });

    it('deve calcular paginação corretamente', async () => {
      // Arrange
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(25);

      // Act
      const result = await getProducts({ page: 2, limit: 10 });

      // Assert
      expect(result.totalPages).toBe(3);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (2 - 1) * 10
          take: 10,
        })
      );
    });
  });

  // ========== TESTES DE OBTER PRODUTO ==========
  describe('getProductById', () => {
    it('deve obter um produto por ID', async () => {
      // Arrange
      const mockProduct = {
        id: 1,
        name: 'Camiseta Azul',
        slug: 'camiseta-azul',
        price: 49.99,
        description: 'Camiseta de qualidade',
        images: ['img1.jpg'],
        colors: ['azul'],
        sizes: ['M', 'G'],
        stock: 10,
        active: true,
        categoryId: 1,
        category: {
          id: 1,
          name: 'Camisetas',
          description: 'Camisetas em geral',
          slug: 'camisetas',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct);

      // Act
      const result = await getProductById(1);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(result.name).toBe('Camiseta Azul');
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 1, active: true },
        include: { category: true },
      });
    });

    it('deve lançar erro quando produto não é encontrado', async () => {
      // Arrange
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      // Act & Assert
      await expect(getProductById(999)).rejects.toThrow(NotFoundError);
      await expect(getProductById(999)).rejects.toThrow(
        'Produto não encontrado.'
      );
    });
  });

  // ========== TESTES DE CRIAÇÃO ==========
  describe('createProduct', () => {
    const validProduct = {
      name: 'Camiseta Nova',
      slug: 'camiseta-nova',
      price: 49.99,
      description: 'Uma camiseta nova',
      categoryId: 1,
      stock: 10,
      active: true,
      images: ['img.jpg'],
      colors: ['azul'],
      sizes: ['M'],
    };

    it('deve criar um novo produto com sucesso', async () => {
      // Arrange
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: 1,
        name: 'Camisetas',
        description: 'Camisetas',
        slug: 'camisetas',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      vi.mocked(prisma.product.create).mockResolvedValue({
        id: 1,
        ...validProduct,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await createProduct(validProduct);

      // Assert
      expect(result.id).toBe(1);
      expect(result.name).toBe('Camiseta Nova');
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: validProduct,
      });
    });

    it('deve lançar erro quando categoria não existe', async () => {
      // Arrange
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

      // Act & Assert
      await expect(createProduct(validProduct)).rejects.toThrow(
        'Categoria não encontrada ou inativa.'
      );
    });

    it('deve lançar erro quando slug já existe', async () => {
      // Arrange
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: 1,
        name: 'Camisetas',
        description: 'Camisetas',
        slug: 'camisetas',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        id: 1,
        ...validProduct,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(createProduct(validProduct)).rejects.toThrow(
        'Já existe um produto com este slug.'
      );
    });
  });

  // ========== TESTES DE ATUALIZAÇÃO ==========
  describe('updateProduct', () => {
    const existingProduct = {
      id: 1,
      name: 'Camiseta Antiga',
      slug: 'camiseta-antiga',
      price: 39.99,
      description: 'Descrição antiga',
      images: ['old.jpg'],
      colors: ['vermelho'],
      sizes: ['M'],
      stock: 5,
      active: true,
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('deve atualizar um produto com sucesso', async () => {
      // Arrange
      const updateData = {
        name: 'Camiseta Nova',
        price: 49.99,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: 1,
        name: 'Camisetas',
        description: 'Camisetas',
        slug: 'camisetas',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.product.update).mockResolvedValue({
        ...existingProduct,
        ...updateData,
      });

      // Act
      const result = await updateProduct(1, updateData);

      // Assert
      expect(result.name).toBe('Camiseta Nova');
      expect(result.price).toBe(49.99);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });

    it('deve lançar erro quando produto não existe', async () => {
      // Arrange
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(
        updateProduct(999, { name: 'Novo Nome' })
      ).rejects.toThrow(NotFoundError);
      await expect(
        updateProduct(999, { name: 'Novo Nome' })
      ).rejects.toThrow('Produto não encontrado.');
    });

    it('deve validar categoria ao atualizar com nova categoria', async () => {
      // Arrange
      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

      // Act & Assert
      await expect(
        updateProduct(1, { categoryId: 999 })
      ).rejects.toThrow('Categoria não encontrada ou inativa.');
    });

    it('deve lançar erro quando novo slug já existe', async () => {
      // Arrange
      vi.mocked(prisma.product.findUnique)
        .mockResolvedValueOnce(existingProduct) // Primeira chamada - busca o produto a atualizar
        .mockResolvedValueOnce({
          // Segunda chamada - verifica se slug existe
          id: 2,
          name: 'Outro Produto',
          slug: 'novo-slug',
          price: 29.99,
          description: 'Outro produto',
          images: [],
          colors: [],
          sizes: [],
          stock: 15,
          active: true,
          categoryId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      // Act & Assert
      await expect(updateProduct(1, { slug: 'novo-slug' })).rejects.toThrow(
        'Slug já existe. Escolha outro nome para o produto.'
      );
    });
  });

  // ========== TESTES DE DELEÇÃO (SOFT DELETE) ==========
  describe('deleteProduct', () => {
    it('deve deletar um produto (soft delete)', async () => {
      // Arrange
      const product = {
        id: 1,
        name: 'Camiseta',
        slug: 'camiseta',
        price: 49.99,
        description: 'Camiseta',
        images: [],
        colors: [],
        sizes: [],
        stock: 10,
        active: true,
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(product);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...product,
        active: false,
      });

      // Act
      await deleteProduct(1);

      // Assert
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { active: false },
      });
    });

    it('deve lançar erro quando produto não existe', async () => {
      // Arrange
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(deleteProduct(999)).rejects.toThrow(NotFoundError);
      await expect(deleteProduct(999)).rejects.toThrow(
        'Produto não encontrado.'
      );
    });
  });
});
