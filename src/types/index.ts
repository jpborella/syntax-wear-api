export interface ProductFilters {
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: 'price' | 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface AuthRequest {
    email: string;
    password: string;
}

export interface RegisterRequest extends AuthRequest {
    firstName: string;
    lastName: string;
    cpf?: string;
    birthDate?: string;
    phone?: string;
    role?: 'USER' | 'ADMIN';
}

export interface CreateProduct {
    name: string;
    price: number;
    description: string;
    images?: string[];
    sizes?: string[];
    colors?: string[];
    stock: number;
    active: boolean;
    slug: string;
    categoryId: number;
}

export interface UpdateProduct extends Partial<CreateProduct> {
    name?: string;
    description?: string;
    price?: number;
    slug?: string;
    stock?: number;
    active?: boolean;
}

export interface CreateCategory {
    name: string;
    description?: string;
    slug: string;
    active: boolean;
}

export interface UpdateCategory extends Partial<CreateCategory> {
    name?: string;
    description?: string;
    slug?: string;
    active?: boolean;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderFilters {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    userId?: number;
}

export interface OrderItemInput {
    productId: number;
    quantity: number;
}

export interface ShippingAddress {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
}

export interface CreateOrder {
    userId?: number;
    paymentMethod: 'PIX' | 'CARD' | 'BOLETO';
    shippingAddress: ShippingAddress;
    items: OrderItemInput[];
}

export interface UpdateOrder {
    status: OrderStatus;
}

export type UserRole = 'USER' | 'ADMIN';

export interface AuthenticatedUser {
    id: number;
    role: UserRole;
}
