import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fastify from 'fastify';
import authRoutes from '../../src/routes/auth.routes';

describe('Auth Routes', () => {
    let app: ReturnType<typeof fastify>;

    beforeEach(async () => {
        app = fastify();
        await app.register(authRoutes, { prefix: '/auth' });
    });

    afterEach(async () => {
        await app.close();
    });

    describe('Route Registration', () => {
        it('deve registrar rotas de auth sem erros', async () => {
            // Assert
            expect(app).toBeDefined();
            const routeOutput = app.printRoutes();
            expect(routeOutput).toBeDefined();
            expect(routeOutput).toContain('POST');
        });

        it('deve incluir /auth/register na saída de rotas', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('register');
        });

        it('deve incluir /auth/login na saída de rotas', async () => {
            // Arrange
            const routeOutput = app.printRoutes();

            // Assert
            expect(routeOutput).toContain('login');
        });
    });
});
