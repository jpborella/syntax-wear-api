import { AuthRequest, RegisterRequest, ConflictError, NotFoundError, UnauthorizedError } from "../types";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import { sanitizeUser } from "../utils/auth.utils";
import { OAuth2Client } from "google-auth-library";
import { getRequiredEnv } from "../config/env";

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
        if (existingUser.email === payload.email) {
            throw new ConflictError("Email já cadastrado.");
        }
        if (existingUser.cpf === payload.cpf) {
            throw new ConflictError("CPF já cadastrado.");
        }
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

export const loginUser = async (data: AuthRequest) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new NotFoundError("Usuário não encontrado.");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
        throw new UnauthorizedError("Senha incorreta.");
    }

    // Remover password do objeto user antes de retorná-lo
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
};

let googleClient: OAuth2Client | undefined;
let googleClientId: string | undefined;

const getGoogleConfig = () => {
    googleClientId ??= getRequiredEnv("GOOGLE_CLIENT_ID");
    googleClient ??= new OAuth2Client(googleClientId);

    return { client: googleClient, clientId: googleClientId };
};

export const loginWithGoogle = async (credential: string) => {
    const { client, clientId } = getGoogleConfig();

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
        throw new UnauthorizedError("Não autorizado.");
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