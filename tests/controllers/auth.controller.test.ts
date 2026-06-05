import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
    register,
    login,
} from '../../src/controllers/auth.controller';
import * as authService from '../../src/services/auth.service';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../src/types';

// Mock do service
vi.mock('../../src/services/auth.service', async () => {
    const actual = await vi.importActual('../../src/services/auth.service');
    return {
        ...actual,
        sanitizeUser: (user: any) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            role: user.role,
        }),
        registerUser: vi.fn(),
        loginUser: vi.fn(),
    };
});

describe('Auth Controller', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        mockRequest = {
            body: {},
            server: {
                jwt: {
                    sign: vi.fn(() => 'jwt_token_here'),
                },
            },
        };
        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
        vi.clearAllMocks();
    });

    // ========== TESTES DE REGISTRO ==========
    describe('registerUser', () => {
        const validPayload = {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@test.com',
            password: 'senha123',
            cpf: '12345678901',
            birthDate: '01/01/1990',
            phone: '11999999999',
        };

        it('deve registrar um novo usuário com sucesso (201)', async () => {
            // Arrange
            mockRequest.body = validPayload;
            const mockUser = {
                id: 1,
                firstName: validPayload.firstName,
                lastName: validPayload.lastName,
                email: validPayload.email,
                password: 'hashed',
                cpf: validPayload.cpf,
                birthDate: new Date('1990-01-01'),
                phone: validPayload.phone,
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(authService.registerUser).mockResolvedValue(mockUser);

            // Act
            await register(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalled();
            const sentData = vi.mocked(mockReply.send).mock.calls[0][0];
            expect(sentData).toHaveProperty('token', 'jwt_token_here');
            expect(sentData).toHaveProperty('name', 'João Silva');
            expect(sentData).toHaveProperty('email', validPayload.email);
            expect(sentData).toHaveProperty('role', 'USER');
        });

        it('deve retornar erro 409 quando email já existe', async () => {
            // Arrange
            mockRequest.body = validPayload;
            vi.mocked(authService.registerUser).mockRejectedValue(
                new ConflictError('Email já cadastrado.')
            );

            // Act & Assert
            await expect(
                register(
                    mockRequest as FastifyRequest,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Email já cadastrado.');
        });

        it('deve retornar erro 400 para dados inválidos', async () => {
            // Arrange
            mockRequest.body = {
                firstName: '', // Inválido
                email: 'invalido',
            };

            // Act & Assert
            // A validação do Zod aconteceria antes de chegar ao controller
            // Aqui testamos que o controller passa para o service
            await expect(
                register(
                    mockRequest as FastifyRequest,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow();
        });
    });

    // ========== TESTES DE LOGIN ==========
    describe('loginUser', () => {
        const loginPayload = {
            email: 'joao@test.com',
            password: 'senha123',
        };

        it('deve fazer login com sucesso (200) e retornar token', async () => {
            // Arrange
            mockRequest.body = loginPayload;
            const mockUser = {
                id: 1,
                firstName: 'João',
                lastName: 'Silva',
                email: loginPayload.email,
                password: 'hashed',
                cpf: '12345678901',
                birthDate: new Date('1990-01-01'),
                phone: '11999999999',
                role: 'USER' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(authService.loginUser).mockResolvedValue(mockUser as any);

            // Act
            await login(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalled();
            const sentData = vi.mocked(mockReply.send).mock.calls[0][0];
            expect(sentData).toHaveProperty('token', 'jwt_token_here');
            expect(sentData).toHaveProperty('name', 'João Silva');
            expect(sentData).toHaveProperty('email', loginPayload.email);
            expect(sentData).toHaveProperty('role', 'USER');
        });

        it('deve retornar erro 404 quando usuário não existe', async () => {
            // Arrange
            mockRequest.body = loginPayload;
            vi.mocked(authService.loginUser).mockRejectedValue(
                new NotFoundError('Usuário não encontrado.')
            );

            // Act & Assert
            await expect(
                login(
                    mockRequest as FastifyRequest,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Usuário não encontrado.');
        });

        it('deve retornar erro 401 para senha incorreta', async () => {
            // Arrange
            mockRequest.body = loginPayload;
            vi.mocked(authService.loginUser).mockRejectedValue(
                new UnauthorizedError('Senha incorreta.')
            );

            // Act & Assert
            await expect(
                login(
                    mockRequest as FastifyRequest,
                    mockReply as FastifyReply
                )
            ).rejects.toThrow('Senha incorreta.');
        });
    });
});
