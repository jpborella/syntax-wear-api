import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";
import {
    AppError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from "../types";

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const isProduction = process.env.NODE_ENV === 'production';

    let statusCode = error.statusCode ?? 500;
    let message = error.message;
    let details: any = undefined;

    if (error instanceof ZodError) {
        statusCode = 400;
        message = 'Erro de validação (Zod).';
        details = z.treeifyError(error);
    } else if (error.code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
        statusCode = 400;
        message = 'Erro de validação (Fastify).';
        details = { body: 'O corpo da requisição não pode ser vazio.' };
    } else if (error.code === 'FST_ERR_JWT_INVALID' || error.code === 'FST_ERR_JWT_MALFORMED') {
        statusCode = 401;
        message = 'Token inválido ou malformado.';
    } else if (error.code === 'FST_ERR_RATE_LIMIT_EXCEEDED') {
        statusCode = 429;
        message = 'Muitas requisições. Tente novamente mais tarde.';
    } else if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;

        if (error instanceof UnauthorizedError) {
            statusCode = 401;
            message = 'Credenciais inválidas.';
        } else if (error instanceof ForbiddenError) {
            statusCode = 403;
        } else if (error instanceof ConflictError) {
            statusCode = 409;
        } else if (error instanceof NotFoundError) {
            statusCode = 404;
        }
    } else if (
        message === 'Usuário não encontrado.' ||
        message === 'Senha incorreta.' ||
        message === 'Usuário não encontrado' ||
        message === 'Senha incorreta'
    ) {
        statusCode = 401;
        message = 'Credenciais inválidas.';
    } else if (
        message === 'Email já cadastrado.' ||
        message === 'CPF já cadastrado.' ||
        message === 'Email já cadastrado' ||
        message === 'CPF já cadastrado'
    ) {
        statusCode = 409;
    } else if (
        message === 'Pedido não encontrado.' ||
        message === 'Produto não encontrado ou inativo.' ||
        message === 'Pedido não encontrado' ||
        message === 'Produto não encontrado ou inativo'
    ) {
        statusCode = 404;
    }

    const response = {
        statusCode,
        message,
        error: error.name !== 'Error' ? error.name : undefined,
        details,
        path: request.url,
        timestamp: new Date().toISOString(),
        debug: !isProduction ? error.message : undefined
    };

    return reply.status(statusCode).send(response);
};
