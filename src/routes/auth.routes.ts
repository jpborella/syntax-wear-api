import { FastifyInstance } from "fastify";
import { login, register } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post(
		"/register",
		{
			schema: {
				tags: ["Auth"],
				description: "Registra um novo usuário e retorna um token JWT",
				body: {
					type: "object",
					properties: {
						firstName: { type: "string", description: "Nome do usuário" },
						email: { type: "string", description: "Email do usuário" },
						lastName: { type: "string", description: "Sobrenome do usuário" },
						password: { type: "string", description: "Senha do usuário" },
						cpf: { type: "string", description: "CPF do usuário (somente números)" },
						birthDate: {
							type: "string",
							description: "Data de nascimento do usuário (DD/MM/AAAA)",
						},
						phone: { type: "string", description: "Telefone do usuário (com DDD, somente números)" },
					},
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
				description: "Realiza login do usuário e retorna um token JWT",
				body: {
					type: "object",
					properties: {
						email: { type: "string", description: "Email do usuário" },
						password: { type: "string", description: "Senha do usuário" },
					},
				},
			},
		},
		login
	);
}
