import "dotenv/config";
import { OrderStatus, PaymentMethod, Prisma, PrismaClient } from "@prisma/client";
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

const products: any[] = [
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
        gender: "UNISSEX",
        isOutlet: false,
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
        gender: "UNISSEX",
        isOutlet: false,
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
        gender: "UNISSEX",
        isOutlet: false,
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
        gender: "MASCULINO",
        isOutlet: false,
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
        gender: "MASCULINO",
        isOutlet: false,
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
        gender: "FEMININO",
        isOutlet: false,
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
        gender: "MASCULINO",
        isOutlet: false,
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
        gender: "UNISSEX",
        isOutlet: false,
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
        gender: "UNISSEX",
        isOutlet: false,
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
        gender: "UNISSEX",
        isOutlet: false,
    },
    {
        name: "Tênis Outlet Trail Lite",
        slug: "tenis-outlet-trail-lite",
        description: "Modelo de outlet para uso diário com conforto leve e sola resistente.",
        price: "189.90",
        sku: "OUT-001",
        images: ["https://placehold.co/600x600?text=OUT-001"],
        sizes: ["38", "39", "40", "41", "42"],
        colors: ["preto", "verde"],
        stock: 18,
        active: true,
        categorySlug: "calcas",
        gender: "MASCULINO",
        isOutlet: true,
    },
    {
        name: "Tênis Outlet Drift Soft",
        slug: "tenis-outlet-drift-soft",
        description: "Sneaker outlet para caminhada e conforto casual com detalhe minimalista.",
        price: "169.90",
        sku: "OUT-002",
        images: ["https://placehold.co/600x600?text=OUT-002"],
        sizes: ["35", "36", "37", "38", "39"],
        colors: ["bege", "cinza"],
        stock: 22,
        active: true,
        categorySlug: "calcas",
        gender: "FEMININO",
        isOutlet: true,
    },
    {
        name: "Camiseta Outlet Baseline",
        slug: "camiseta-outlet-baseline",
        description: "Camiseta de outlet em algodão com estampa discreta e corte confortável.",
        price: "79.90",
        sku: "OUT-003",
        images: ["https://placehold.co/600x600?text=OUT-003"],
        sizes: ["P", "M", "G"],
        colors: ["branco", "grafite"],
        stock: 28,
        active: true,
        categorySlug: "camisetas",
        gender: "MASCULINO",
        isOutlet: true,
    },
    {
        name: "Moletom Outlet Urban Flow",
        slug: "moletom-outlet-urban-flow",
        description: "Moletom outlet em fleece macio com acabamento premium para o dia a dia.",
        price: "219.90",
        sku: "OUT-004",
        images: ["https://placehold.co/600x600?text=OUT-004"],
        sizes: ["P", "M", "G", "GG"],
        colors: ["preto", "cinza"],
        stock: 20,
        active: true,
        categorySlug: "moletons",
        gender: "MASCULINO",
        isOutlet: true,
    },
    {
        name: "Sapatilha Outlet Melody",
        slug: "sapatilha-outlet-melody",
        description: "Sapatilha outlet feminina com sola leve e visual sofisticado.",
        price: "149.90",
        sku: "OUT-005",
        images: ["https://placehold.co/600x600?text=OUT-005"],
        sizes: ["36", "37", "38", "39", "40"],
        colors: ["rosa", "marrom"],
        stock: 25,
        active: true,
        categorySlug: "acessorios",
        gender: "FEMININO",
        isOutlet: true,
    },
    {
        name: "Jaqueta Outlet Cloud",
        slug: "jaqueta-outlet-cloud",
        description: "Jaqueta outlet em tecido leve com visual moderno e excelente custo-benefício.",
        price: "249.90",
        sku: "OUT-006",
        images: ["https://placehold.co/600x600?text=OUT-006"],
        sizes: ["P", "M", "G", "GG"],
        colors: ["preto", "azul"],
        stock: 16,
        active: true,
        categorySlug: "moletons",
        gender: "FEMININO",
        isOutlet: true,
    },
];

const orderSeeds = [
    {
        seedKey: "order-seed-1",
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.PIX,
        shippingAddress: {
            seedKey: "order-seed-1",
            cep: "01001000",
            street: "Praca da Se",
            number: "100",
            complement: "Sala 1",
            neighborhood: "Se",
            city: "Sao Paulo",
            state: "SP",
            country: "BR",
        },
        items: [
            { productSlug: "camiseta-oversized-code-black", quantity: 2 },
            { productSlug: "meia-mid-crew-pixel", quantity: 3 },
        ],
    },
    {
        seedKey: "order-seed-2",
        status: OrderStatus.PAID,
        paymentMethod: PaymentMethod.CARD,
        shippingAddress: {
            seedKey: "order-seed-2",
            cep: "01311000",
            street: "Avenida Paulista",
            number: "1500",
            complement: "Conjunto 101",
            neighborhood: "Bela Vista",
            city: "Sao Paulo",
            state: "SP",
            country: "BR",
        },
        items: [
            { productSlug: "moletom-full-zip-binary", quantity: 1 },
            { productSlug: "calca-jogger-stack", quantity: 1 },
        ],
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

    const orderProductSlugs = Array.from(
        new Set(orderSeeds.flatMap((order) => order.items.map((item) => item.productSlug)))
    );

    const seedProducts = await prisma.product.findMany({
        where: { slug: { in: orderProductSlugs } },
        select: { id: true, slug: true, price: true },
    });

    const productMap = new Map(seedProducts.map((product) => [product.slug, product]));

    for (const orderSeed of orderSeeds) {
        const existingOrder = await prisma.order.findFirst({
            where: {
                shippingAddress: {
                    path: ["seedKey"],
                    equals: orderSeed.seedKey,
                },
            },
        });

        if (existingOrder) {
            continue;
        }

        const missingSlugs = orderSeed.items
            .filter((item) => !productMap.has(item.productSlug))
            .map((item) => item.productSlug);

        if (missingSlugs.length > 0) {
            console.warn(
                `Seed de pedidos ignorado (${orderSeed.seedKey}). Produtos ausentes: ${missingSlugs.join(", ")}`
            );
            continue;
        }

        let total = new Prisma.Decimal(0);
        const itemsData = orderSeed.items.map((item) => {
            const product = productMap.get(item.productSlug)!;
            const price = product.price;

            total = total.plus(price.mul(item.quantity));

            return {
                product: { connect: { id: product.id } },
                price,
                quantity: item.quantity,
            };
        });

        await prisma.order.create({
            data: {
                status: orderSeed.status,
                paymentMethod: orderSeed.paymentMethod,
                shippingAddress: orderSeed.shippingAddress,
                total,
                items: {
                    create: itemsData,
                },
            },
        });
    }

    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    const totalOrderItems = await prisma.orderItem.count();
    console.log(
        `Seed finalizado. Produtos: ${totalProducts}. Pedidos: ${totalOrders}. Itens: ${totalOrderItems}`
    );
}

main()
    .catch((error) => {
        console.error("Erro ao executar seed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
