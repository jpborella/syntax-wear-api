export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isPublic: boolean;

    constructor(message: string, statusCode = 400, isPublic = true) {
        super(message);
        this.statusCode = statusCode;
        this.isPublic = isPublic;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Recurso não encontrado.") {
        super(message, 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Não autorizado.") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Acesso negado.") {
        super(message, 403);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}
