import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../utils/prisma";

type JwtPayload = {
    userId?: number;
};

export const authenticate = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const payload = await request.jwtVerify<JwtPayload>();

        if (!payload.userId) {
            reply.status(401).send({ error: "Token invalido ou expirado." });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, role: true },
        });

        if (!user) {
            reply.status(401).send({ error: "Token invalido ou expirado." });
            return;
        }

        request.authUser = user;
    } catch (err) {
        reply.status(401).send({ error: "Token invalido ou expirado." });
        return;
    }
};
