import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyReply, FastifyRequest, FastifyError } from 'fastify';
import { errorHandler } from '../../src/middlewares/error.middleware';
import { ZodError } from 'zod';

describe('Error Middleware', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;
    let sendedResponse: any;

    beforeEach(() => {
        mockRequest = {
            url: '/api/users',
        };
        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockImplementation((data) => {
                sendedResponse = data;
                return mockReply;
            }),
        };
        sendedResponse = undefined;
        vi.clearAllMocks();
        // Mock process.env.NODE_ENV para testes
        process.env.NODE_ENV = 'development';
    });

    // ========== TESTES DE ERRO GENÉRICO ==========
    describe('errorHandler - Erros Genéricos', () => {
        it('deve retornar 500 para erro genérico', () => {
            // Arrange
            const error = new Error('Internal server error') as FastifyError;
            error.statusCode = 500;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(sendedResponse.statusCode).toBe(500);
            expect(sendedResponse.message).toBe('Internal server error');
        });

        it('deve retornar statusCode customizado do erro', () => {
            // Arrange
            const error = new Error('Not found') as FastifyError;
            error.statusCode = 404;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(sendedResponse.statusCode).toBe(404);
        });
    });

    // ========== TESTES DE ERRO ZOD ==========
    describe('errorHandler - ZodError', () => {
        it('deve retornar 400 para ZodError', () => {
            // Arrange
            const zodError = new ZodError([
                {
                    code: 'invalid_type',
                    expected: 'string',
                    received: 'undefined',
                    path: ['email'],
                    message: 'Required',
                } as any,
            ]);

            // Act
            errorHandler(
                zodError as any,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(sendedResponse.statusCode).toBe(400);
            expect(sendedResponse.message).toBe('Erro de validação (Zod).');
            expect(sendedResponse.details).toBeDefined();
        });
    });

    // ========== TESTES DE ERRO FASTIFY ==========
    describe('errorHandler - Fastify Errors', () => {
        it('deve retornar 400 para corpo JSON vazio', () => {
            // Arrange
            const error = new Error('Empty JSON body') as FastifyError;
            error.code = 'FST_ERR_CTP_EMPTY_JSON_BODY';
            error.statusCode = 400;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(sendedResponse.message).toBe('Erro de validação (Fastify).');
            expect(sendedResponse.details).toEqual({
                body: 'O corpo da requisicao nao pode ser vazio.',
            });
        });

        it('deve retornar 401 para JWT inválido', () => {
            // Arrange
            const error = new Error('Invalid JWT') as FastifyError;
            error.code = 'FST_ERR_JWT_INVALID';
            error.statusCode = 401;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(sendedResponse.message).toBe('Token inválido ou malformado.');
        });

        it('deve retornar 401 para JWT malformado', () => {
            // Arrange
            const error = new Error('Malformed JWT') as FastifyError;
            error.code = 'FST_ERR_JWT_MALFORMED';
            error.statusCode = 401;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(sendedResponse.message).toBe('Token inválido ou malformado.');
        });

        it('deve retornar 429 para rate limit excedido', () => {
            // Arrange
            const error = new Error('Rate limit exceeded') as FastifyError;
            error.code = 'FST_ERR_RATE_LIMIT_EXCEEDED';
            error.statusCode = 429;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(429);
            expect(sendedResponse.message).toBe(
                'Muitas requisições. Tente novamente mais tarde.'
            );
        });
    });

    // ========== TESTES DE ERRO DE NEGÓCIO ==========
    describe('errorHandler - Erros de Negócio', () => {
        it('deve retornar 401 para "Usuário não encontrado"', () => {
            // Arrange
            const error = new Error('Usuário não encontrado.') as FastifyError;
            error.statusCode = 404;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(sendedResponse.message).toBe('Credenciais inválidas.');
        });

        it('deve retornar 401 para "Senha incorreta"', () => {
            // Arrange
            const error = new Error('Senha incorreta.') as FastifyError;
            error.statusCode = 401;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(sendedResponse.message).toBe('Credenciais inválidas.');
        });

        it('deve retornar 409 para "Email já cadastrado"', () => {
            // Arrange
            const error = new Error('Email já cadastrado.') as FastifyError;
            error.statusCode = 409;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(sendedResponse.message).toBe('Email já cadastrado.');
        });

        it('deve retornar 409 para "CPF já cadastrado"', () => {
            // Arrange
            const error = new Error('CPF já cadastrado.') as FastifyError;
            error.statusCode = 409;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(sendedResponse.message).toBe('CPF já cadastrado.');
        });

        it('deve retornar 404 para "Pedido nao encontrado"', () => {
            // Arrange
            const error = new Error('Pedido nao encontrado.') as FastifyError;
            error.statusCode = 404;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(sendedResponse.statusCode).toBe(404);
        });

        it('deve retornar 404 para "Produto nao encontrado ou inativo"', () => {
            // Arrange
            const error = new Error(
                'Produto nao encontrado ou inativo.'
            ) as FastifyError;
            error.statusCode = 404;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(sendedResponse.statusCode).toBe(404);
        });
    });

    // ========== TESTES DE RESPOSTA ==========
    describe('errorHandler - Resposta', () => {
        it('deve incluir campos obrigatórios na resposta', () => {
            // Arrange
            const error = new Error('Test error') as FastifyError;
            error.statusCode = 400;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(sendedResponse).toHaveProperty('statusCode');
            expect(sendedResponse).toHaveProperty('message');
            expect(sendedResponse).toHaveProperty('error');
            expect(sendedResponse).toHaveProperty('path');
            expect(sendedResponse).toHaveProperty('timestamp');
        });

        it('deve incluir URL correta na resposta', () => {
            // Arrange
            const error = new Error('Test error') as FastifyError;
            error.statusCode = 400;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(sendedResponse.path).toBe('/api/users');
        });

        it('deve incluir timestamp em formato ISO na resposta', () => {
            // Arrange
            const error = new Error('Test error') as FastifyError;
            error.statusCode = 400;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(sendedResponse.timestamp).toMatch(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
            );
        });

        it('deve incluir debug em desenvolvimento', () => {
            // Arrange
            process.env.NODE_ENV = 'development';
            const error = new Error('Test error') as FastifyError;
            error.statusCode = 400;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(sendedResponse.debug).toBe('Test error');
        });

        it('deve omitir debug em produção', () => {
            // Arrange
            process.env.NODE_ENV = 'production';
            const error = new Error('Test error') as FastifyError;
            error.statusCode = 400;

            // Act
            errorHandler(
                error,
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(sendedResponse.debug).toBeUndefined();
        });
    });
});
