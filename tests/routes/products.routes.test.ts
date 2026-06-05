import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fastify from 'fastify';
import productRoutes from '../../src/routes/products.routes';

describe('Products Routes', () => {
    let app: ReturnType<typeof fastify>;

    beforeEach(async () => {
        app = fastify();
        await app.register(productRoutes, { prefix: '/products' });
    });

    afterEach(async () => {
        await app.close();
    });

    describe('Route Registration', () => {
        it('deve registrar rotas de produtos sem erros', async () => {
            // Assert
            expect(app).toBeDefined();
            const routeOutput = app.printRoutes();
            expect(routeOutput).toBeDefined();
        });

        it('deve incluir GET em products', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('GET');
            expect(routeOutput).toContain('products');
        });

        it('deve incluir POST em products', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('POST');
        });

        it('deve incluir PUT em products', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('PUT');
        });

        it('deve incluir DELETE em products', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('DELETE');
        });
    });
});
