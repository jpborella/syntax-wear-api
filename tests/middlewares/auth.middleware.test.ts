import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../src/middlewares/auth.middleware';
import * as prismaModule from '../../src/utils/prisma';

// Mock do prisma
vi.mock('../../src/utils/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

describe('Auth Middleware', () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        mockRequest = {
            jwtVerify: vi.fn(),
        };
        mockReply = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
        vi.clearAllMocks();
    });

    // ========== TESTES DE SUCESSO ==========
    describe('authenticate', () => {
        it('deve autenticar usuário com token válido (200)', async () => {
            // Arrange
            const mockUser = {
                id: 1,
                role: 'USER',
            };

            vi.mocked(mockRequest.jwtVerify as any).mockResolvedValue({
                userId: 1,
            });

            vi.mocked(prismaModule.prisma.user.findUnique).mockResolvedValue(
                mockUser as any
            );

            // Act
            await authenticate(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockRequest.authUser).toEqual(mockUser);
            expect(mockReply.status).not.toHaveBeenCalled();
            expect(mockReply.send).not.toHaveBeenCalled();
        });

        it('deve autenticar usuário admin com token válido', async () => {
            // Arrange
            const mockAdmin = {
                id: 2,
                role: 'ADMIN',
            };

            vi.mocked(mockRequest.jwtVerify as any).mockResolvedValue({
                userId: 2,
            });

            vi.mocked(prismaModule.prisma.user.findUnique).mockResolvedValue(
                mockAdmin as any
            );

            // Act
            await authenticate(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockRequest.authUser).toEqual(mockAdmin);
            expect(mockReply.status).not.toHaveBeenCalled();
        });
    });

    // ========== TESTES DE ERRO - TOKEN INVÁLIDO ==========
    describe('authenticate - Token Inválido', () => {
        it('deve retornar 401 quando userId está ausente (401)', async () => {
            // Arrange
            vi.mocked(mockRequest.jwtVerify as any).mockResolvedValue({});

            // Act
            await authenticate(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Token invalido ou expirado.',
            });
        });

        it('deve retornar 401 quando jwtVerify falha', async () => {
            // Arrange
            vi.mocked(mockRequest.jwtVerify as any).mockRejectedValue(
                new Error('Invalid token')
            );

            // Act
            await authenticate(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Token invalido ou expirado.',
            });
        });

        it('deve retornar 401 quando usuário não existe no banco', async () => {
            // Arrange
            vi.mocked(mockRequest.jwtVerify as any).mockResolvedValue({
                userId: 999,
            });

            vi.mocked(prismaModule.prisma.user.findUnique).mockResolvedValue(
                null
            );

            // Act
            await authenticate(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Token invalido ou expirado.',
            });
        });

        it('deve retornar 401 quando prisma.user.findUnique falha', async () => {
            // Arrange
            vi.mocked(mockRequest.jwtVerify as any).mockResolvedValue({
                userId: 1,
            });

            vi.mocked(prismaModule.prisma.user.findUnique).mockRejectedValue(
                new Error('Database error')
            );

            // Act
            await authenticate(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockReply.status).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Token invalido ou expirado.',
            });
        });
    });

    // ========== TESTES DE CASOS ESPECIAIS ==========
    describe('authenticate - Casos Especiais', () => {
        it('deve chamar prisma.user.findUnique com select correto', async () => {
            // Arrange
            vi.mocked(mockRequest.jwtVerify as any).mockResolvedValue({
                userId: 1,
            });

            vi.mocked(prismaModule.prisma.user.findUnique).mockResolvedValue({
                id: 1,
                role: 'USER',
            } as any);

            // Act
            await authenticate(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(prismaModule.prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: { id: true, role: true },
            });
        });

        it('deve chamar jwtVerify sem argumentos', async () => {
            // Arrange
            vi.mocked(mockRequest.jwtVerify as any).mockResolvedValue({
                userId: 1,
            });

            vi.mocked(prismaModule.prisma.user.findUnique).mockResolvedValue({
                id: 1,
                role: 'USER',
            } as any);

            // Act
            await authenticate(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            // Assert
            expect(mockRequest.jwtVerify).toHaveBeenCalled();
        });
    });
});
