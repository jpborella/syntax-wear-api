import 'dotenv/config';

export const getRequiredEnv = (name: string): string => {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
    }

    return value;
};

export const validateEnv = () => {
    return {
        DATABASE_URL: getRequiredEnv('DATABASE_URL'),
        JWT_SECRET: getRequiredEnv('JWT_SECRET'),
        GOOGLE_CLIENT_ID: getRequiredEnv('GOOGLE_CLIENT_ID'),
    };
};
