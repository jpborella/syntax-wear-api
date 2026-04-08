import { RegisterRequest } from "../types";
import { prisma } from "../utils/prisma";

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
        throw new Error(existingUser.email === payload.email ? "Email já cadastrado." : "CPF já cadastrado.");
    }

    const newUser = await prisma.user.create({
        data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            password: payload.password,
            cpf: payload.cpf,
            birthDate: payload.birthDate ? new Date(`${payload.birthDate}T00:00:00.000Z`) : undefined,
            phone: payload.phone,
            role: "USER",
        },
    });

    return newUser;
};
