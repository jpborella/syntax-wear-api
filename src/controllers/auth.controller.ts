import { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, registerUser, sanitizeUser } from "../services/auth.service";
import { AuthRequest, RegisterRequest } from "../types";
import { loginSchema, registerSchema } from "../utils/validator";

export const register = async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
    const validation = registerSchema.parse(request.body as RegisterRequest);

    const user = await registerUser(validation);
    const authUser = sanitizeUser(user);

    const token = request.server.jwt.sign({ userId: user.id });

    reply.status(201).send({
        ...authUser,
        token,
    });
};

export const login = async (request: FastifyRequest<{ Body: AuthRequest }>, reply: FastifyReply) => {
    const validation = loginSchema.parse(request.body as AuthRequest);

    const user = await loginUser(validation);
    const authUser = sanitizeUser(user);

    const token = request.server.jwt.sign({ userId: user.id });

    reply.setCookie('syntaxwear.token', token, {
        httpOnly: true, // Impede o acesso ao cookie via JavaScript
        secure: process.env.NODE_ENV === 'production', // Garante que o cookie seja enviado apenas em conexões HTTPS em produção
        sameSite: 'lax', // Protege contra CSRF - permite envio em requisições de navegação normal
        path: '/', // Define o caminho para o qual o cookie é válido (todo o site)
        maxAge: 60 * 60 * 24, // Define a duração do cookie em segundos (1 dia)
    });

    reply.status(200).send({
        ...authUser
    });
};

export const profile = async (request: FastifyRequest, reply: FastifyReply) => reply.send(request.user)