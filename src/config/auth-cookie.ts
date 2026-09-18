export const AUTH_COOKIE_NAME = 'syntaxwear.token';

export const getAuthCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' as const : 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24,
    };
};
