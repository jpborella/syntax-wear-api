import 'dotenv/config';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import productsRoutes from './routes/products.routes';
import categoriesRoutes from './routes/categories.routes';
import ordersRoutes from './routes/orders.routes';
import jwt from '@fastify/jwt';
import authRoutes from './routes/auth.routes';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { errorHandler } from './middlewares/error.middleware';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não definida no ambiente');
}

export async function buildApp() {
    const fastify = Fastify({
        logger: true,
    });

    fastify.register(rateLimit, {
        max: 100,
        timeWindow: '15 minutes',
    });

    fastify.register(jwt, {
        secret: JWT_SECRET,
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
        origin: true,
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
    fastify.register(categoriesRoutes, { prefix: '/admin/categories' });
    fastify.register(ordersRoutes, { prefix: '/orders' });
    fastify.register(authRoutes, { prefix: '/auth' });

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
