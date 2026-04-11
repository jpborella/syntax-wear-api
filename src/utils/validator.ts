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
    page: z.coerce.number().int().positive("Página deve ser um número positivo.").optional(),
    limit: z.coerce.number().int().positive("Limite deve ser um número positivo.").optional(),
    minPrice: z.coerce.number().positive("Preço mínimo deve ser um número positivo.").optional(),
    maxPrice: z.coerce.number().positive("Preço máximo deve ser um número positivo.").optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(['price', 'name', 'createdAt'], { message: "Ordenar por deve ser: price, name ou createdAt." }).optional(),
    sortOrder: z.enum(['asc', 'desc'], { message: "Ordem de classificação deve ser: asc ou desc." }).optional(),
});