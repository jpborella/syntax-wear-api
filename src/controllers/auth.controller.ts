import { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, loginWithGoogle, registerUser, sanitizeUser } from "../services/auth.service";
import { AuthRequest, RegisterRequest } from "../types";
import { loginSchema, registerSchema, updateProfileSchema } from "../utils/validator";
import { prisma } from "../utils/prisma";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "../config/auth-cookie";

export const register = async (request: FastifyRequest, reply: FastifyReply) => {

    const validation = registerSchema.parse(request.body as RegisterRequest);
    const user = await registerUser(validation);
    if (!user) return;
    const authUser = sanitizeUser(user);
    const token = request.server.jwt.sign({ userId: user.id });

    reply.setCookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    reply.status(201).send({ ...authUser, token });
};

export const login = async (request: FastifyRequest<{ Body: AuthRequest }>, reply: FastifyReply) => {
    const validation = loginSchema.parse(request.body as AuthRequest);

    const user = await loginUser(validation);

    if (!user) return;

    const token = request.server.jwt.sign({ userId: user.id });

    reply.setCookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    reply.status(200).send({ ...sanitizeUser(user), token });
};

export const profile = async (request: FastifyRequest, reply: FastifyReply) => reply.send(request.user);

export const updateProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
        reply.status(401).send({ error: "Usuário não autenticado." });
        return;
    }

    const { phone } = updateProfileSchema.parse(request.body);
    const user = await prisma.user.update({
        where: { id: request.authUser.id },
        data: { phone },
    });

    reply.send(sanitizeUser(user));
};

export const googleLogin = async (request: FastifyRequest<{ Body: { credential: string } }>, reply: FastifyReply) => {
    // Lógica de login com Google OAuth2.0
    const { credential } = request.body;

    if (!credential) {
        reply.status(400).send({ message: "Credencial do Google é obrigatória." });
        return;
    }

    const user = await loginWithGoogle(request.body.credential);
    if (!user) return;

    const token = request.server.jwt.sign({ userId: user.id });

    reply.setCookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    reply.status(200).send({
        user,
    });
};

export const signOut = async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());

    reply.status(200).send({ message: "Logout realizado com sucesso." });
};