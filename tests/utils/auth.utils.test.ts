import { describe, it, expect } from 'vitest';
import { User } from '@prisma/client';
import { sanitizeUser, validateOwnership } from '../../src/utils/auth.utils';
import { AuthenticatedUser, ForbiddenError } from '../../src/types';

describe('Auth Utils', () => {
    describe('sanitizeUser', () => {
        const mockUser: User = {
            id: 1,
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao@example.com',
            password: 'hashed_password_12345',
            role: 'USER',
            cpf: '12345678900',
            birthDate: '1990-01-01',
            phone: '11987654321',
            active: true,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
        };

        it('deve retornar UserResponse sem campos sensíveis', () => {
            // Act
            const result = sanitizeUser(mockUser);

            // Assert
            expect(result).toEqual({
                id: 1,
                name: 'João Silva',
                email: 'joao@example.com',
                role: 'USER',
            });
        });

        it('não deve incluir password no resultado', () => {
            // Act
            const result = sanitizeUser(mockUser);

            // Assert
            expect(result).not.toHaveProperty('password');
        });

        it('não deve incluir cpf no resultado', () => {
            // Act
            const result = sanitizeUser(mockUser);

            // Assert
            expect(result).not.toHaveProperty('cpf');
        });

        it('não deve incluir birthDate no resultado', () => {
            // Act
            const result = sanitizeUser(mockUser);

            // Assert
            expect(result).not.toHaveProperty('birthDate');
        });

        it('não deve incluir phone no resultado', () => {
            // Act
            const result = sanitizeUser(mockUser);

            // Assert
            expect(result).not.toHaveProperty('phone');
        });

        it('deve juntar firstName e lastName com espaço', () => {
            // Act
            const result = sanitizeUser(mockUser);

            // Assert
            expect(result.name).toBe('João Silva');
        });

        it('deve trim o nome se firstName ou lastName estiverem vazios', () => {
            // Arrange
            const userWithEmptyFirstName: User = {
                ...mockUser,
                firstName: '',
                lastName: 'Silva',
            };

            // Act
            const result = sanitizeUser(userWithEmptyFirstName);

            // Assert
            expect(result.name).toBe('Silva');
        });

        it('deve preservar role do usuário', () => {
            // Act
            const result = sanitizeUser(mockUser);

            // Assert
            expect(result.role).toBe('USER');
        });

        it('deve retornar role ADMIN quando usuário é admin', () => {
            // Arrange
            const adminUser: User = { ...mockUser, role: 'ADMIN' };

            // Act
            const result = sanitizeUser(adminUser);

            // Assert
            expect(result.role).toBe('ADMIN');
        });
    });

    describe('validateOwnership', () => {
        const mockAuthUser: AuthenticatedUser = {
            id: 1,
            role: 'USER',
        };

        const mockAdminUser: AuthenticatedUser = {
            id: 2,
            role: 'ADMIN',
        };

        it('deve permitir acesso se usuário é dono do recurso', () => {
            // Arrange
            const ownerId = 1;

            // Act & Assert
            expect(() => validateOwnership(mockAuthUser, ownerId)).not.toThrow();
        });

        it('deve permitir acesso se usuário é admin', () => {
            // Arrange
            const ownerId = 999;

            // Act & Assert
            expect(() => validateOwnership(mockAdminUser, ownerId)).not.toThrow();
        });

        it('deve lançar ForbiddenError se usuário não é dono e não é admin', () => {
            // Arrange
            const ownerId = 2;

            // Act & Assert
            expect(() => validateOwnership(mockAuthUser, ownerId)).toThrow(ForbiddenError);
        });

        it('deve lançar ForbiddenError com mensagem apropriada', () => {
            // Arrange
            const ownerId = 2;

            // Act & Assert
            expect(() => validateOwnership(mockAuthUser, ownerId)).toThrow(
                'Você não tem permissão para acessar este recurso.'
            );
        });

        it('deve permitir acesso se ownerId é null e usuário é admin', () => {
            // Arrange
            const ownerId = null;

            // Act & Assert
            expect(() => validateOwnership(mockAdminUser, ownerId)).not.toThrow();
        });

        it('deve lançar erro se ownerId é null e usuário não é admin', () => {
            // Arrange
            const ownerId = null;

            // Act & Assert
            expect(() => validateOwnership(mockAuthUser, ownerId)).toThrow(ForbiddenError);
        });

        it('deve funcionar com IDs grande', () => {
            // Arrange
            const authUser: AuthenticatedUser = { id: 999999, role: 'USER' };
            const ownerId = 999999;

            // Act & Assert
            expect(() => validateOwnership(authUser, ownerId)).not.toThrow();
        });

        it('deve ser case-sensitive para role ADMIN', () => {
            // Arrange
            const userWithWrongRole: AuthenticatedUser = { id: 1, role: 'admin' as any };
            const ownerId = 999;

            // Act & Assert
            expect(() => validateOwnership(userWithWrongRole, ownerId)).toThrow(ForbiddenError);
        });
    });
});
