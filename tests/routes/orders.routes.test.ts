import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fastify from 'fastify';
import orderRoutes from '../../src/routes/orders.routes';

describe('Orders Routes', () => {
    let app: ReturnType<typeof fastify>;

    beforeEach(async () => {
        app = fastify();
        await app.register(orderRoutes, { prefix: '/orders' });
    });

    afterEach(async () => {
        await app.close();
    });

    describe('Route Registration', () => {
        it('deve registrar rotas de pedidos sem erros', async () => {
            // Assert
            expect(app).toBeDefined();
            const routeOutput = app.printRoutes();
            expect(routeOutput).toBeDefined();
        });

        it('deve incluir GET em orders', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('GET');
            expect(routeOutput).toContain('orders');
        });

        it('deve incluir POST em orders', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('POST');
        });

        it('deve incluir PUT em orders', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('PUT');
        });

        it('deve incluir DELETE em orders', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('DELETE');
        });
    });
});
