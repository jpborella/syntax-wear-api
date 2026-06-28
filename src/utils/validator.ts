import z from "zod";

export const loginSchema = z.object({
    email: z.email("Email inválido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.")
});

export const registerSchema = z.object({
    firstName: z.string().trim().min(2, "O nome é obrigatório."),
    lastName: z.string().trim().min(2, "O sobrenome é obrigatório."),
    email: z.email("Email inválido."),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
    cpf: z
        .string()
        .trim()
        .regex(/^\d{11}$/, "CPF deve conter 11 números.")
        .optional(),
    birthDate: z
        .string()
        .regex(/^\d{2}\/\d{2}\/\d{4}$/, "A data deve estar no formato DD/MM/AAAA.")
        .optional(),
    phone: z
        .string()
        .trim()
        .regex(/^\d{10,11}$/, "Telefone deve conter DDD e número (10 ou 11 dígitos).")
        .optional(),
});

export const productFiltersSchema = z.object({
    page: z.coerce.number().int().positive("Página deve ser um número positivo.").optional().default(1),
    limit: z.coerce.number().int().positive("Limite deve ser um número positivo.").max(50, "Limite máximo é 50.").optional().default(10),
    minPrice: z.coerce.number().positive("Preço mínimo deve ser um número positivo.").optional(),
    maxPrice: z.coerce.number().positive("Preço máximo deve ser um número positivo.").optional(),
    search: z.string().trim().optional(),
    categoryId: z.coerce.number().int().positive("A categoria é obrigatória.").optional(),
    sortBy: z.enum(['price', 'name', 'createdAt'], { message: "Ordenar por deve ser: price, name ou createdAt." }).optional(),
    sortOrder: z.enum(['asc', 'desc'], { message: "Ordem de classificação deve ser: asc ou desc." }).optional(),
});

export const createProductSchema = z.object({
    name: z.string().trim().min(2, "O nome é obrigatório."),
    price: z.coerce.number().positive("O preço deve ser um número positivo."),
    description: z.string().trim().min(10, "A descrição deve ter pelo menos 10 caracteres."),
    colors: z.array(z.string().trim()).optional(),
    sizes: z.array(z.string().trim()).optional(),
    slug: z.string().trim().min(2, "O slug é obrigatório."),
    stock: z.coerce.number().int().min(0, "O estoque não pode ser negativo."),
    active: z.boolean().optional().default(true),
    images: z.array(z.string()).optional(),
    categoryId: z.coerce.number().int().positive("A categoria é obrigatória."),
});

export const updateProductSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").optional(),
    description: z.string().min(1, "Descrição é obrigatória").optional(),
    price: z.number().nonnegative("Preço deve ser positivo").optional(),
    categoryId: z.coerce.number().int().positive("A categoria é obrigatória.").optional(),
    colors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    slug: z.string().min(1, "Slug é obrigatório").optional(),
    stock: z.number().int().nonnegative("Estoque deve ser positivo").optional(),
    active: z.boolean().optional(),
    images: z.array(z.string()).optional(),
});

export const deleteProductSchema = z.object({
    id: z.number().int().min(1, "ID inválido"),
});

export const createCategorySchema = z.object({
    name: z.string().trim().min(2, "O nome e obrigatorio."),
    description: z
        .string()
        .trim()
        .min(2, "A descricao deve ter pelo menos 2 caracteres.")
        .optional(),
    slug: z.string().trim().min(2, "O slug e obrigatorio."),
    active: z.boolean(),
});

export const updateCategorySchema = z.object({
    name: z.string().trim().min(2, "Nome e obrigatorio.").optional(),
    description: z
        .string()
        .trim()
        .min(2, "Descricao deve ter pelo menos 2 caracteres.")
        .optional(),
    slug: z.string().trim().min(2, "Slug e obrigatorio.").optional(),
    active: z.boolean().optional(),
});

export const categoryIdSchema = z.object({
    id: z.coerce.number().int().positive("ID invalido."),
});

export const productIdSchema = z.object({
    id: z.coerce.number().int().positive("ID invalido."),
});

export const orderFiltersSchema = z.object({
    page: z.coerce.number().int().positive("Pagina deve ser um numero positivo.").optional().default(1),
    limit: z.coerce.number().int().positive("Limite deve ser um numero positivo.").max(50, "Limite maximo e 50.").optional().default(10),
    status: z
        .enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"], {
            message: "Status invalido.",
        })
        .optional(),
    userId: z.coerce.number().int().positive("Usuario invalido.").optional(),
});

export const orderIdSchema = z.object({
    id: z.coerce.number().int().positive("ID invalido."),
});

export const orderItemSchema = z.object({
    productId: z.coerce.number().int().positive("Produto invalido."),
    quantity: z.coerce.number().int().positive("Quantidade deve ser maior que zero."),
});

export const shippingAddressSchema = z.object({
    cep: z.string().trim().min(8, "CEP invalido."),
    street: z.string().trim().min(2, "Rua e obrigatoria."),
    number: z.string().trim().min(1, "Numero e obrigatorio."),
    complement: z.string().trim().optional(),
    neighborhood: z.string().trim().min(2, "Bairro e obrigatorio."),
    city: z.string().trim().min(2, "Cidade e obrigatoria."),
    state: z.string().trim().min(2, "Estado e obrigatorio."),
    country: z.string().trim().min(2, "Pais e obrigatorio."),
});

export const createOrderSchema = z.object({
    userId: z.coerce.number().int().positive("Usuario invalido.").optional(),
    paymentMethod: z.enum(["PIX", "CARD", "BOLETO"], {
        message: "Metodo de pagamento invalido.",
    }),
    shippingAddress: shippingAddressSchema,
    items: z.array(orderItemSchema).min(1, "Itens do pedido sao obrigatorios."),
});

export const updateOrderSchema = z.object({
    status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"], {
        message: "Status invalido.",
    }),
});