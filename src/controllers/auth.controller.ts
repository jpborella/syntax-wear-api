import { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, loginWithGoogle, registerUser, sanitizeUser } from "../services/auth.service";
import { AuthRequest, RegisterRequest } from "../types";
import { loginSchema, registerSchema } from "../utils/validator";

export const register = async (request: FastifyRequest, reply: FastifyReply) => {

    const validation = registerSchema.parse(request.body as RegisterRequest);
    const user = await registerUser(validation, reply);
    if (!user) return;
    const authUser = sanitizeUser(user);
    const token = request.server.jwt.sign({ userId: user.id });

    reply.setCookie('syntaxwear.token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    });

    reply.status(201).send({
        authUser,
    });
};

export const login = async (request: FastifyRequest<{ Body: AuthRequest }>, reply: FastifyReply) => {
    const validation = loginSchema.parse(request.body as AuthRequest);

    const user = await loginUser(validation, reply);

    if (!user) return;

    const token = request.server.jwt.sign({ userId: user.id });

    reply.setCookie('syntaxwear.token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    });

    reply.status(200).send({
        user,
    });
};

export const profile = async (request: FastifyRequest, reply: FastifyReply) => reply.send(request.user);

export const googleLogin = async (request: FastifyRequest<{ Body: { credential: string } }>, reply: FastifyReply) => {
    // Lógica de login com Google OAuth2.0
    const { credential } = request.body;

    if (!credential) {
        reply.status(400).send({ message: "Credencial do Google é obrigatória." });
        return;
    }

    const user = await loginWithGoogle(request.body.credential, reply);
    if (!user) return;

    const token = request.server.jwt.sign({ userId: user.id });

    reply.setCookie('syntaxwear.token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
    });

    reply.status(200).send({
        user,
    });
};

export const signOut = async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('syntaxwear.token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    reply.status(200).send({ message: "Logout realizado com sucesso." });
};