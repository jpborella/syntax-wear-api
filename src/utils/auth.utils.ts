import { User } from "@prisma/client";
import { UserResponse, AuthenticatedUser, ForbiddenError } from "../types";

/**
 * Sanitiza um objeto de usuário removendo campos sensíveis.
 */
export const sanitizeUser = (user: User): UserResponse => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
});

/**
 * Valida se o usuário logado é dono do recurso ou se é admin.
 */
export const validateOwnership = (user: AuthenticatedUser, ownerId: number | null): void => {
    if (user.role === "ADMIN") return;
    if (ownerId !== user.id) {
        throw new ForbiddenError("Você não tem permissão para acessar este recurso.");
    }
};
