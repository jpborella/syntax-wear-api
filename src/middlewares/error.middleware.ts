import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";

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
        details = { body: 'O corpo da requisicao nao pode ser vazio.' };
    } else if (error.code === 'FST_ERR_JWT_INVALID' || error.code === 'FST_ERR_JWT_MALFORMED') {
        statusCode = 401;
        message = 'Token inválido ou malformado.';
    } else if (error.code === 'FST_ERR_RATE_LIMIT_EXCEEDED') {
        statusCode = 429;
        message = 'Muitas requisições. Tente novamente mais tarde.';
    } else if (message === 'Usuário não encontrado.' || message === 'Senha incorreta.') {
        // Obscurece erro de login para evitar enumeração de usuários
        statusCode = 401;
        message = 'Credenciais inválidas.';
    } else if (message === 'Email já cadastrado.' || message === 'CPF já cadastrado.') {
        statusCode = 409;
    } else if (message === 'Pedido nao encontrado.' || message === 'Produto nao encontrado ou inativo.') {
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
