import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL nao encontrada no ambiente.");
}

const dbUrl = new URL(connectionString);

if (!dbUrl.searchParams.has("sslmode")) {
    dbUrl.searchParams.set("sslmode", "require");
}

if (!dbUrl.searchParams.has("uselibpqcompat")) {
    dbUrl.searchParams.set("uselibpqcompat", "true");
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({
        connectionString: dbUrl.toString(),
    }),
});

const categories = [
    { name: "Camisetas", slug: "camisetas" },
    { name: "Moletons", slug: "moletons" },
    { name: "Calcas", slug: "calcas" },
    { name: "Acessorios", slug: "acessorios" },
];

const products = [
    {
        name: "Camiseta Oversized Code Black",
        slug: "camiseta-oversized-code-black",
        description: "Camiseta oversized em algodao premium.",
        price: "119.90",
        sku: "CAM-001",
        images: ["https://placehold.co/600x600?text=CAM-001"],
        sizes: ["P", "M", "G", "GG"],
        colors: ["preto", "branco"],
        stock: 30,
        active: true,
        categorySlug: "camisetas",
    },
    {
        name: "Camiseta Dev Mode",
        slug: "camiseta-dev-mode",
        description: "Modelagem reta com estampa frontal.",
        price: "99.90",
        sku: "CAM-002",
        images: ["https://placehold.co/600x600?text=CAM-002"],
        sizes: ["P", "M", "G"],
        colors: ["grafite", "off-white"],
        stock: 22,
        active: true,
        categorySlug: "camisetas",
    },
    {
        name: "Camiseta Minimal Syntax",
        slug: "camiseta-minimal-syntax",
        description: "Visual limpo com toque macio.",
        price: "89.90",
        sku: "CAM-003",
        images: ["https://placehold.co/600x600?text=CAM-003"],
        sizes: ["P", "M", "G", "GG"],
        colors: ["branco", "azul-marinho"],
        stock: 18,
        active: true,
        categorySlug: "camisetas",
    },
    {
        name: "Moletom Full Zip Binary",
        slug: "moletom-full-zip-binary",
        description: "Moletom com zip completo e forro peluciado.",
        price: "249.90",
        sku: "MOL-001",
        images: ["https://placehold.co/600x600?text=MOL-001"],
        sizes: ["M", "G", "GG"],
        colors: ["preto", "cinza"],
        stock: 12,
        active: true,
        categorySlug: "moletons",
    },
    {
        name: "Moletom Canguru Runtime",
        slug: "moletom-canguru-runtime",
        description: "Capuz ajustavel e bolso canguru.",
        price: "219.90",
        sku: "MOL-002",
        images: ["https://placehold.co/600x600?text=MOL-002"],
        sizes: ["P", "M", "G"],
        colors: ["verde-militar", "preto"],
        stock: 16,
        active: true,
        categorySlug: "moletons",
    },
    {
        name: "Calca Jogger Stack",
        slug: "calca-jogger-stack",
        description: "Jogger com elastico e corte moderno.",
        price: "179.90",
        sku: "CAL-001",
        images: ["https://placehold.co/600x600?text=CAL-001"],
        sizes: ["38", "40", "42", "44"],
        colors: ["preto", "chumbo"],
        stock: 25,
        active: true,
        categorySlug: "calcas",
    },
    {
        name: "Calca Cargo Utility",
        slug: "calca-cargo-utility",
        description: "Cargo com bolsos laterais funcionais.",
        price: "199.90",
        sku: "CAL-002",
        images: ["https://placehold.co/600x600?text=CAL-002"],
        sizes: ["38", "40", "42", "44", "46"],
        colors: ["caqui", "preto"],
        stock: 14,
        active: true,
        categorySlug: "calcas",
    },
    {
        name: "Boné Dad Hat Console",
        slug: "bone-dad-hat-console",
        description: "Bone aba curva com bordado frontal.",
        price: "79.90",
        sku: "ACE-001",
        images: ["https://placehold.co/600x600?text=ACE-001"],
        sizes: ["UNICO"],
        colors: ["preto", "bege"],
        stock: 40,
        active: true,
        categorySlug: "acessorios",
    },
    {
        name: "Meia Mid Crew Pixel",
        slug: "meia-mid-crew-pixel",
        description: "Par de meias cano medio em algodao.",
        price: "39.90",
        sku: "ACE-002",
        images: ["https://placehold.co/600x600?text=ACE-002"],
        sizes: ["39-43"],
        colors: ["branco", "preto"],
        stock: 60,
        active: true,
        categorySlug: "acessorios",
    },
    {
        name: "Shoulder Bag API",
        slug: "shoulder-bag-api",
        description: "Bolsa transversal compacta para o dia a dia.",
        price: "129.90",
        sku: "ACE-003",
        images: ["https://placehold.co/600x600?text=ACE-003"],
        sizes: ["UNICO"],
        colors: ["preto", "marrom"],
        stock: 20,
        active: true,
        categorySlug: "acessorios",
    },
];

async function main() {
    for (const category of categories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: { name: category.name },
            create: category,
        });
    }

    for (const product of products) {
        const { categorySlug, ...data } = product;

        await prisma.product.upsert({
            where: { slug: data.slug },
            update: {
                ...data,
                category: { connect: { slug: categorySlug } },
            },
            create: {
                ...data,
                category: { connect: { slug: categorySlug } },
            },
        });
    }

    const totalProducts = await prisma.product.count();
    console.log(`Seed finalizado. Produtos na base: ${totalProducts}`);
}

main()
    .catch((error) => {
        console.error("Erro ao executar seed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
