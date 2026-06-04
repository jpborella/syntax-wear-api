import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock do Prisma - deve estar antes dos imports
vi.mock('../../utils/prisma', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

// Mock do bcrypt - simples
vi.mock('bcrypt');

// Importar depois dos mocks
import { registerUser, loginUser } from '../auth.service';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../types';
import { prisma } from '../../utils/prisma';
import * as bcrypt from 'bcrypt';

describe('Auth Service', () => {
    beforeEach(() => {
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

        it('deve registrar um novo usuário com sucesso', async () => {
            // Arrange - preparar dados
            const hashedPassword = 'hashed_senha123';
            vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
            vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
            vi.mocked(prisma.user.create).mockResolvedValue({
                id: 1,
                firstName: validPayload.firstName,
                lastName: validPayload.lastName,
                email: validPayload.email,
                password: hashedPassword,
                cpf: validPayload.cpf,
                birthDate: new Date('1990-01-01'),
                phone: validPayload.phone,
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Act - executar a função
            const result = await registerUser(validPayload);

            // Assert - verificar resultado
            expect(result.email).toBe(validPayload.email);
            expect(result.role).toBe('USER');
            expect(prisma.user.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { email: validPayload.email },
                        { cpf: validPayload.cpf },
                    ],
                },
            });
        });

        it('deve lançar erro ConflictError quando email já existe', async () => {
            // Arrange
            vi.mocked(prisma.user.findFirst).mockResolvedValue({
                id: 1,
                firstName: 'Outro',
                lastName: 'Usuário',
                email: validPayload.email,
                password: 'hash',
                cpf: null,
                birthDate: null,
                phone: null,
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Act & Assert
            await expect(registerUser(validPayload)).rejects.toThrow(ConflictError);
            await expect(registerUser(validPayload)).rejects.toThrow('Email já cadastrado.');
        });

        it('deve lançar erro ConflictError quando CPF já existe', async () => {
            // Arrange
            vi.mocked(prisma.user.findFirst).mockResolvedValue({
                id: 1,
                firstName: 'Outro',
                lastName: 'Usuário',
                email: 'outro@test.com',
                password: 'hash',
                cpf: validPayload.cpf,
                birthDate: null,
                phone: null,
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Act & Assert
            await expect(registerUser(validPayload)).rejects.toThrow(ConflictError);
            await expect(registerUser(validPayload)).rejects.toThrow('CPF já cadastrado.');
        });
    });

    // ========== TESTES DE LOGIN ==========
    describe('loginUser', () => {
        const loginPayload = {
            email: 'joao@test.com',
            password: 'senha123',
        };

        it('deve fazer login com sucesso', async () => {
            // Arrange
            const user = {
                id: 1,
                firstName: 'João',
                lastName: 'Silva',
                email: loginPayload.email,
                password: 'hashed_senha123',
                cpf: '12345678901',
                birthDate: new Date('1990-01-01'),
                phone: '11999999999',
                role: 'USER' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.user.findUnique).mockResolvedValue(user);
            vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

            // Act
            const result = await loginUser(loginPayload);

            // Assert
            expect(result.id).toBe(1);
            expect(result.email).toBe(loginPayload.email);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: loginPayload.email },
            });
        });

        it('deve lançar NotFoundError quando usuário não existe', async () => {
            // Arrange
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

            // Act & Assert
            await expect(loginUser(loginPayload)).rejects.toThrow(NotFoundError);
            await expect(loginUser(loginPayload)).rejects.toThrow('Usuário não encontrado.');
        });

        it('deve lançar UnauthorizedError quando senha está incorreta', async () => {
            // Arrange
            const user = {
                id: 1,
                firstName: 'João',
                lastName: 'Silva',
                email: loginPayload.email,
                password: 'hashed_senha_incorreta',
                cpf: '12345678901',
                birthDate: new Date('1990-01-01'),
                phone: '11999999999',
                role: 'USER' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            vi.mocked(prisma.user.findUnique).mockResolvedValue(user);
            vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

            // Act & Assert
            await expect(loginUser(loginPayload)).rejects.toThrow(UnauthorizedError);
            await expect(loginUser(loginPayload)).rejects.toThrow('Senha incorreta.');
        });
    });
});
