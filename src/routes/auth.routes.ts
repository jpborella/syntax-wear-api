import { FastifyInstance } from "fastify";
import { googleLogin, login, profile, register } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

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
			config: {
				rateLimit: {
					max: 5,
					timeWindow: "15 minutes",
				},
			},
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
			config: {
				rateLimit: {
					max: 5,
					timeWindow: "15 minutes",
				},
			},
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

	fastify.get("/profile", {
		preHandler: [authenticate], // Protege a rota com o middleware de autenticação
		schema: {
			tags: ["Auth"],
			description: "Retorna o perfil do usuário autenticado",
			security: [{ bearerAuth: [] }], // Indica que a rota requer autenticação
		},
	}, profile);

	fastify.post(
		"/google",
		{
			schema: {
				tags: ["Auth"],
				description: "Realiza login do usuario com Google e retorna um token JWT.",
				body: {
					type: "object",
					required: ["credential"],
					properties: {
						credential: { type: "string", description: "Credencial do Google." },
					},
				},
			},
		},
		googleLogin
	);
}