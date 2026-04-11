import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if(error instanceof ZodError) {
        return reply.status(400).send({
            message: 'Validation Error (zod)',
            errors: z.treeifyError(error)
        });
    }

    if ("validation" in error) {
        return reply.status(400).send({
            message: 'Validation Error (fastify)',
            errors: error.validation,
        });
    }

    return reply.status(500).send({ message: 'Internal Server Error' });
};