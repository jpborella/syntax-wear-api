import { describe, it, expect } from 'vitest';
import {
    loginSchema,
    registerSchema,
    productFiltersSchema,
    createProductSchema,
    updateProductSchema,
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema,
    productIdSchema,
    orderFiltersSchema,
    orderIdSchema,
    orderItemSchema,
    shippingAddressSchema,
    createOrderSchema,
    updateOrderSchema,
} from '../../src/utils/validator';

describe('Validator Schemas', () => {
    describe('loginSchema', () => {
        it('deve validar login com email e senha válidos', () => {
            // Arrange
            const data = {
                email: 'user@example.com',
                password: 'password123',
            };

            // Act
            const result = loginSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve rejeitar email inválido', () => {
            // Arrange
            const data = {
                email: 'invalid-email',
                password: 'password123',
            };

            // Act
            const result = loginSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar senha com menos de 6 caracteres', () => {
            // Arrange
            const data = {
                email: 'user@example.com',
                password: '12345',
            };

            // Act
            const result = loginSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('registerSchema', () => {
        it('deve validar registro com dados completos', () => {
            // Arrange
            const data = {
                firstName: 'João',
                lastName: 'Silva',
                email: 'joao@example.com',
                password: 'password123',
                cpf: '12345678900',
                birthDate: '01/01/1990',
                phone: '11987654321',
            };

            // Act
            const result = registerSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve validar registro com dados obrigatórios apenas', () => {
            // Arrange
            const data = {
                firstName: 'João',
                lastName: 'Silva',
                email: 'joao@example.com',
                password: 'password123',
            };

            // Act
            const result = registerSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve rejeitar firstName com menos de 2 caracteres', () => {
            // Arrange
            const data = {
                firstName: 'J',
                lastName: 'Silva',
                email: 'joao@example.com',
                password: 'password123',
            };

            // Act
            const result = registerSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar CPF inválido', () => {
            // Arrange
            const data = {
                firstName: 'João',
                lastName: 'Silva',
                email: 'joao@example.com',
                password: 'password123',
                cpf: '123456789',
            };

            // Act
            const result = registerSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar data de nascimento em formato inválido', () => {
            // Arrange
            const data = {
                firstName: 'João',
                lastName: 'Silva',
                email: 'joao@example.com',
                password: 'password123',
                birthDate: '1990-01-01',
            };

            // Act
            const result = registerSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar telefone com menos de 10 dígitos', () => {
            // Arrange
            const data = {
                firstName: 'João',
                lastName: 'Silva',
                email: 'joao@example.com',
                password: 'password123',
                phone: '119876543',
            };

            // Act
            const result = registerSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('productFiltersSchema', () => {
        it('deve validar filtros com valores padrão', () => {
            // Arrange
            const data = {};

            // Act
            const result = productFiltersSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(1);
                expect(result.data.limit).toBe(10);
            }
        });

        it('deve validar filtros com todos os parâmetros', () => {
            // Arrange
            const data = {
                page: 2,
                limit: 20,
                minPrice: 100,
                maxPrice: 500,
                search: 'camiseta',
                sortBy: 'price',
                sortOrder: 'asc',
            };

            // Act
            const result = productFiltersSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve rejeitar limit maior que 50', () => {
            // Arrange
            const data = { limit: 51 };

            // Act
            const result = productFiltersSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar sortBy inválido', () => {
            // Arrange
            const data = { sortBy: 'invalid' };

            // Act
            const result = productFiltersSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('createProductSchema', () => {
        it('deve validar produto com dados completos', () => {
            // Arrange
            const data = {
                name: 'Camiseta',
                price: 99.99,
                description: 'Descrição do produto com mais de 10 caracteres',
                colors: ['preto', 'branco'],
                sizes: ['P', 'M', 'G'],
                slug: 'camiseta',
                stock: 10,
                active: true,
                categoryId: 1,
            };

            // Act
            const result = createProductSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve rejeitar nome com menos de 2 caracteres', () => {
            // Arrange
            const data = {
                name: 'C',
                price: 99.99,
                description: 'Descrição do produto com mais de 10 caracteres',
                slug: 'camiseta',
                stock: 10,
                categoryId: 1,
            };

            // Act
            const result = createProductSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar preço negativo', () => {
            // Arrange
            const data = {
                name: 'Camiseta',
                price: -10,
                description: 'Descrição do produto com mais de 10 caracteres',
                slug: 'camiseta',
                stock: 10,
                categoryId: 1,
            };

            // Act
            const result = createProductSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar descrição com menos de 10 caracteres', () => {
            // Arrange
            const data = {
                name: 'Camiseta',
                price: 99.99,
                description: 'Curta',
                slug: 'camiseta',
                stock: 10,
                categoryId: 1,
            };

            // Act
            const result = createProductSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar estoque negativo', () => {
            // Arrange
            const data = {
                name: 'Camiseta',
                price: 99.99,
                description: 'Descrição do produto com mais de 10 caracteres',
                slug: 'camiseta',
                stock: -5,
                categoryId: 1,
            };

            // Act
            const result = createProductSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('createCategorySchema', () => {
        it('deve validar categoria com dados completos', () => {
            // Arrange
            const data = {
                name: 'Roupas',
                description: 'Descrição de roupas',
                slug: 'roupas',
                active: true,
            };

            // Act
            const result = createCategorySchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve validar categoria com dados obrigatórios apenas', () => {
            // Arrange
            const data = {
                name: 'Roupas',
                slug: 'roupas',
                active: true,
            };

            // Act
            const result = createCategorySchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve rejeitar nome com menos de 2 caracteres', () => {
            // Arrange
            const data = {
                name: 'R',
                slug: 'roupas',
                active: true,
            };

            // Act
            const result = createCategorySchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('shippingAddressSchema', () => {
        it('deve validar endereço completo', () => {
            // Arrange
            const data = {
                cep: '01310100',
                street: 'Avenida Paulista',
                number: '1000',
                complement: 'Apto 101',
                neighborhood: 'Bela Vista',
                city: 'São Paulo',
                state: 'SP',
                country: 'Brasil',
            };

            // Act
            const result = shippingAddressSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve validar endereço sem complement', () => {
            // Arrange
            const data = {
                cep: '01310100',
                street: 'Avenida Paulista',
                number: '1000',
                neighborhood: 'Bela Vista',
                city: 'São Paulo',
                state: 'SP',
                country: 'Brasil',
            };

            // Act
            const result = shippingAddressSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve rejeitar CEP muito curto', () => {
            // Arrange
            const data = {
                cep: '0131010',
                street: 'Avenida Paulista',
                number: '1000',
                neighborhood: 'Bela Vista',
                city: 'São Paulo',
                state: 'SP',
                country: 'Brasil',
            };

            // Act
            const result = shippingAddressSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('createOrderSchema', () => {
        it('deve validar pedido com dados completos', () => {
            // Arrange
            const data = {
                paymentMethod: 'CARD',
                shippingAddress: {
                    cep: '01310100',
                    street: 'Avenida Paulista',
                    number: '1000',
                    neighborhood: 'Bela Vista',
                    city: 'São Paulo',
                    state: 'SP',
                    country: 'Brasil',
                },
                items: [
                    { productId: 1, quantity: 2 },
                    { productId: 2, quantity: 1 },
                ],
            };

            // Act
            const result = createOrderSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve aceitar PIX como método de pagamento', () => {
            // Arrange
            const data = {
                paymentMethod: 'PIX',
                shippingAddress: {
                    cep: '01310100',
                    street: 'Avenida Paulista',
                    number: '1000',
                    neighborhood: 'Bela Vista',
                    city: 'São Paulo',
                    state: 'SP',
                    country: 'Brasil',
                },
                items: [{ productId: 1, quantity: 1 }],
            };

            // Act
            const result = createOrderSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve rejeitar método de pagamento inválido', () => {
            // Arrange
            const data = {
                paymentMethod: 'BITCOIN',
                shippingAddress: {
                    cep: '01310100',
                    street: 'Avenida Paulista',
                    number: '1000',
                    neighborhood: 'Bela Vista',
                    city: 'São Paulo',
                    state: 'SP',
                    country: 'Brasil',
                },
                items: [{ productId: 1, quantity: 1 }],
            };

            // Act
            const result = createOrderSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar pedido sem itens', () => {
            // Arrange
            const data = {
                paymentMethod: 'CARD',
                shippingAddress: {
                    cep: '01310100',
                    street: 'Avenida Paulista',
                    number: '1000',
                    neighborhood: 'Bela Vista',
                    city: 'São Paulo',
                    state: 'SP',
                    country: 'Brasil',
                },
                items: [],
            };

            // Act
            const result = createOrderSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('updateOrderSchema', () => {
        it('deve validar atualização de status com PAID', () => {
            // Arrange
            const data = { status: 'PAID' };

            // Act
            const result = updateOrderSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve validar todos os status válidos', () => {
            // Arrange
            const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

            // Act & Assert
            validStatuses.forEach((status) => {
                const result = updateOrderSchema.safeParse({ status });
                expect(result.success).toBe(true);
            });
        });

        it('deve rejeitar status inválido', () => {
            // Arrange
            const data = { status: 'PROCESSING' };

            // Act
            const result = updateOrderSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('categoryIdSchema', () => {
        it('deve validar ID positivo', () => {
            // Arrange
            const data = { id: 1 };

            // Act
            const result = categoryIdSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve converter string para número', () => {
            // Arrange
            const data = { id: '5' };

            // Act
            const result = categoryIdSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(5);
                expect(typeof result.data.id).toBe('number');
            }
        });

        it('deve rejeitar ID zero', () => {
            // Arrange
            const data = { id: 0 };

            // Act
            const result = categoryIdSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });

    describe('orderItemSchema', () => {
        it('deve validar item com productId e quantity válidos', () => {
            // Arrange
            const data = { productId: 1, quantity: 2 };

            // Act
            const result = orderItemSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(true);
        });

        it('deve rejeitar quantity zero', () => {
            // Arrange
            const data = { productId: 1, quantity: 0 };

            // Act
            const result = orderItemSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });

        it('deve rejeitar productId negativo', () => {
            // Arrange
            const data = { productId: -1, quantity: 1 };

            // Act
            const result = orderItemSchema.safeParse(data);

            // Assert
            expect(result.success).toBe(false);
        });
    });
});
