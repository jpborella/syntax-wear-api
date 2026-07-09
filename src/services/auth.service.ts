import { AuthRequest, RegisterRequest, ConflictError, NotFoundError, UnauthorizedError } from "../types";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import { sanitizeUser } from "../utils/auth.utils";
import { FastifyReply } from "fastify";

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
