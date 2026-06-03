import { FastifyInstance } from "fastify";
import { login, register } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
	const authResponseSchema = {
		type: "object",
		properties: {
			id: { type: "number" },
			name: { type: "string" },
			email: { type: "string" },
			role: { type: "string", enum: ["USER", "ADMIN"] },
			token: { type: "string" },
		},
	};

	fastify.post(
		"/register",
		{
			schema: {
				tags: ["Auth"],
				description: "Registra um novo usuario e retorna um token JWT.",
				body: {
					type: "object",
					properties: {
						firstName: { type: "string", description: "Nome do usuario." },
						email: { type: "string", description: "Email do usuario." },
						lastName: { type: "string", description: "Sobrenome do usuario." },
						password: { type: "string", description: "Senha do usuario." },
						cpf: { type: "string", description: "CPF do usuario (somente numeros)." },
						birthDate: {
							type: "string",
							description: "Data de nascimento do usuario (DD/MM/AAAA).",
						},
						phone: {
							type: "string",
							description: "Telefone do usuario (com DDD, somente numeros).",
						},
					},
				},
				response: {
					201: authResponseSchema,
				},
			},
		},
		register
	);

	fastify.post(
		"/login",
		{
			schema: {
				tags: ["Auth"],
				description: "Realiza login do usuario e retorna um token JWT.",
				body: {
					type: "object",
					properties: {
						email: { type: "string", description: "Email do usuario." },
						password: { type: "string", description: "Senha do usuario." },
					},
				},
				response: {
					200: authResponseSchema,
				},
			},
		},
		login
	);
}
