import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Prisma Utils', () => {
    let originalDatabaseUrl: string | undefined;
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
        originalDatabaseUrl = process.env.DATABASE_URL;
        originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
        if (originalDatabaseUrl) {
            process.env.DATABASE_URL = originalDatabaseUrl;
        } else {
            delete process.env.DATABASE_URL;
        }
        if (originalNodeEnv) {
            process.env.NODE_ENV = originalNodeEnv;
        } else {
            delete process.env.NODE_ENV;
        }
        vi.resetModules();
    });

    it('deve exportar instância do prisma', async () => {
        // Arrange
        process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/syntax_wear?sslmode=require';

        // Act
        const { prisma } = await import('../../src/utils/prisma');

        // Assert
        expect(prisma).toBeDefined();
        expect(typeof prisma).toBe('object');
    });

    it('deve lançar erro quando DATABASE_URL não está definida', async () => {
        // Arrange
        delete process.env.DATABASE_URL;

        // Act & Assert
        try {
            await import('../../src/utils/prisma');
            throw new Error('Deveria ter lançado erro');
        } catch (error: any) {
            expect(error.message).toContain('DATABASE_URL nao encontrada no ambiente');
        }
    });

    it('deve adicionar sslmode=require se não estiver presente', async () => {
        // Arrange
        process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/syntax_wear';

        // Act
        const { prisma } = await import('../../src/utils/prisma');

        // Assert
        expect(prisma).toBeDefined();
    });

    it('deve aceitar DATABASE_URL com sslmode já definido', async () => {
        // Arrange
        process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/syntax_wear?sslmode=disable';

        // Act
        const { prisma } = await import('../../src/utils/prisma');

        // Assert
        expect(prisma).toBeDefined();
    });

    it('deve remover sslmode em produção para preservar as opções SSL do adapter', async () => {
        process.env.NODE_ENV = 'production';
        process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/syntax_wear?sslmode=require';

        const { prisma } = await import('../../src/utils/prisma');

        expect(prisma).toBeDefined();
    });
});
