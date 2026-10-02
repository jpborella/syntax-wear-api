import 'dotenv/config';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import productsRoutes from './routes/products.routes';
import categoriesRoutes from './routes/categories.routes';
import ordersRoutes from './routes/orders.routes';
import jwt from '@fastify/jwt';
import authRoutes from './routes/auth.routes';
import cartRoutes from './routes/cart.routes';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { errorHandler } from './middlewares/error.middleware';
import fastifyCookie from '@fastify/cookie';
import { validateEnv } from './config/env';
import { AUTH_COOKIE_NAME } from './config/auth-cookie';
import { ALLOWED_ORIGINS, API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW } from './config/constants';

export async function buildApp() {
    const env = validateEnv();
    const fastify = Fastify({
        logger: true,
    });

    fastify.register(rateLimit, {
        max: API_RATE_LIMIT_MAX,
        timeWindow: API_RATE_LIMIT_WINDOW,
    });

    fastify.register(fastifyCookie);

    fastify.register(jwt, {
        secret: env.JWT_SECRET,
        cookie: {
            cookieName: AUTH_COOKIE_NAME,
            signed: false,
        },
        sign: {
            expiresIn: "1h",
            iss: "syntax-wear-api",
            aud: "syntax-wear-client",
        },
        verify: {
            allowedIss: "syntax-wear-api",
            allowedAud: "syntax-wear-client",
        },
    });

    fastify.register(cors, {
        origin: ALLOWED_ORIGINS,
        credentials: true,
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });

    fastify.register(helmet, {
        contentSecurityPolicy: false,
    });

    fastify.register(swagger, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'Syntax Wear API',
                version: '1.0.0',
                description: 'API para o e-commerce Syntax Wear.',
            },
            servers: [],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Autenticação via token JWT.',
                    },
                },
            },
        },
    });

    fastify.register(productsRoutes, { prefix: '/products' });
    fastify.register(categoriesRoutes, { prefix: '/categories' });
    fastify.register(ordersRoutes, { prefix: '/orders' });
    fastify.register(authRoutes, { prefix: '/auth' });
    fastify.register(cartRoutes, { prefix: '/cart' });

    fastify.get('/', async () => {
        return {
            message: 'E-commerce Syntax Wear API.',
            version: '1.0.0',
            status: 'running',
        };
    });

    fastify.get('/health', async () => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    });

    fastify.setErrorHandler(errorHandler);

    // Registrar API Docs
    const { default: scalar } = await import('@scalar/fastify-api-reference');
    fastify.register(scalar, {
        routePrefix: '/api-docs',
        configuration: {
            theme: 'default',
        },
    });

    return fastify;
}

export default buildApp;
