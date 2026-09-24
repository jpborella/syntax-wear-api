import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL nao encontrada no ambiente.");
}

const dbUrl = new URL(connectionString);
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
    dbUrl.searchParams.delete("sslmode");
} else if (!dbUrl.searchParams.has("sslmode")) {
    dbUrl.searchParams.set("sslmode", "require");
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: dbUrl.toString(),
        ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    }),
});

export { prisma };
