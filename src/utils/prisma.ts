import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL nao encontrada no ambiente.");
}

const dbUrl = new URL(connectionString);

if (!dbUrl.searchParams.has("sslmode")) {
    dbUrl.searchParams.set("sslmode", "require");
}

const isProduction = process.env.NODE_ENV === "production";
const forceTlsDisabled = process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" || isProduction;

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: dbUrl.toString(),
        ...(forceTlsDisabled
            ? {
                ssl: {
                    rejectUnauthorized: false,
                },
            }
            : {}),
    }),
});

export { prisma };
