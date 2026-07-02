import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL nao encontrada no ambiente.");
}

const dbUrl = new URL(connectionString);

if (!dbUrl.searchParams.has("sslmode")) {
    dbUrl.searchParams.set("sslmode", "require");
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: dbUrl.toString(),
    }),
});

async function main() {
    const testUsers = [
        {
            firstName: "Usuário",
            lastName: "Teste",
            email: "testuser@syntaxwear.com.br",
            plainPassword: "password123",
            cpf: "12345678901",
            phone: "11999999999",
            birthDate: new Date("2000-01-01T00:00:00.000Z"),
            role: Role.USER,
        },
        {
            firstName: "Admin",
            lastName: "Teste",
            email: "adminuser@syntaxwear.com.br",
            plainPassword: "adminpassword",
            cpf: "98765432109",
            phone: "11988888888",
            birthDate: new Date("1990-01-01T00:00:00.000Z"),
            role: Role.ADMIN,
        },
    ];

    console.log("Iniciando cadastro dos usuários de teste...");

    for (const user of testUsers) {
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: user.email },
                    { cpf: user.cpf },
                ],
            },
        });

        if (existing) {
            console.log(`Usuário com email ${user.email} ou CPF ${user.cpf} já existe. Atualizando senha e dados...`);
            const hashedPassword = await bcrypt.hash(user.plainPassword, 10);
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    password: hashedPassword,
                    phone: user.phone,
                    birthDate: user.birthDate,
                    role: user.role,
                },
            });
        } else {
            console.log(`Criando usuário ${user.email}...`);
            const hashedPassword = await bcrypt.hash(user.plainPassword, 10);
            await prisma.user.create({
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    password: hashedPassword,
                    cpf: user.cpf,
                    phone: user.phone,
                    birthDate: user.birthDate,
                    role: user.role,
                },
            });
        }
    }

    console.log("Cadastro concluído com sucesso!");
}

main()
    .catch((error) => {
        console.error("Erro ao cadastrar usuários de teste:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
