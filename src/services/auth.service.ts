import { AuthRequest, RegisterRequest, ConflictError, NotFoundError, UnauthorizedError } from "../types";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import { sanitizeUser } from "../utils/auth.utils";
import { FastifyReply } from "fastify";
import { OAuth2Client } from "google-auth-library";

const parseBrDate = (value: string) => {
    const [day, month, year] = value.split("/");
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
};

export { sanitizeUser };

export const registerUser = async (payload: RegisterRequest) => {
    const existingUser = await prisma.user.findFirst({
        where: payload.cpf
            ? {
                OR: [
                    { email: payload.email },
                    { cpf: payload.cpf },
                ],
            }
            : { email: payload.email },
    });

    if (existingUser) {
        throw new ConflictError(existingUser.email === payload.email ? "Email já cadastrado." : "CPF já cadastrado.");
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const newUser = await prisma.user.create({
        data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: hashedPassword,
            cpf: payload.cpf,
            birthDate: payload.birthDate ? parseBrDate(payload.birthDate) : undefined,
            phone: payload.phone,
            role: "USER",
        },
    });

    return newUser;
};

export const loginUser = async (data: AuthRequest, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        reply.status(409).send({ message: "As credenciais estão incorretas." });
        return;
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
        reply.status(401).send({ message: "As credenciais estão incorretas." });
        return;
    }

    // Remover password do objeto user antes de retorná-lo
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginWithGoogle = async (
    credential: string,
    reply: FastifyReply
) => {
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        reply.status(401).send({ message: "Não autorizado." });
        return;
    }

    const { email, given_name, family_name } = payload;

    let user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Se o usuário não existir, cria um novo usuário com os dados do Google
        user = await prisma.user.create({
            data: {
                firstName: given_name || "",
                lastName: family_name || "",
                email,
                password: "", // Nenhuma senha é definida para usuários do Google
                role: "USER",
            },
        });
    }

    // Remover password do objeto user antes de retorná-lo
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};