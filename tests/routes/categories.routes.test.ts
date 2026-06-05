import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fastify from 'fastify';
import categoryRoutes from '../../src/routes/categories.routes';

describe('Categories Routes', () => {
    let app: ReturnType<typeof fastify>;

    beforeEach(async () => {
        app = fastify();
        await app.register(categoryRoutes, { prefix: '/categories' });
    });

    afterEach(async () => {
        await app.close();
    });

    describe('Route Registration', () => {
        it('deve registrar rotas de categorias sem erros', async () => {
            // Assert
            expect(app).toBeDefined();
            const routeOutput = app.printRoutes();
            expect(routeOutput).toBeDefined();
        });

        it('deve incluir GET em categories', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('GET');
            expect(routeOutput).toContain('categories');
        });

        it('deve incluir POST em categories', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('POST');
        });

        it('deve incluir PUT em categories', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('PUT');
        });

        it('deve incluir DELETE em categories', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('DELETE');
        });
    });
});
