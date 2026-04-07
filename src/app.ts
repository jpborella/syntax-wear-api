import Fastify from 'fastify'
import 'dotenv/config'
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import productsRoutes from './routes/products.routes';

const PORT = parseInt(process.env.PORT ?? '3000');
const HOST = process.env.HOST ?? '0.0.0.0';

const fastify = Fastify({
    logger: true
})

fastify.register(cors, {
    origin: true,
    credentials: true,
})

fastify.register(helmet, {
    contentSecurityPolicy: false
});

fastify.register(swagger, {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'Syntax Wear API',
            version: '1.0.0',
            description: 'API para o e-commerce Syntax Wear',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Servidor de desenvolvimento',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Autenticação via token JWT',
                },
            },
        },
    },
})

fastify.register(productsRoutes, { prefix: '/products' });

fastify.get('/', async () => {
    return {
        message: 'E-commerce Syntax Wear API',
        version: '1.0.0',
        status: 'running',
    }
});

fastify.get('/health', async () => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
    }
});

async function registerApiDocs() {
    const { default: scalar } = await import('@scalar/fastify-api-reference');

    fastify.register(scalar, {
        routePrefix: '/api-docs',
        configuration: {
            theme: 'default'
        },
    })
}

async function startServer() {
    await registerApiDocs();

    try {
        await fastify.listen({ port: PORT, host: HOST })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

void startServer();

export default fastify;