import { Role, OrderStatus, PaymentMethod } from "@prisma/client";

export interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: Role;
}

export interface AuthResponse extends UserResponse {
    token: string;
}

export interface ProductResponse {
    id: number;
    name: string;
    slug: string;
    price: string | number;
    images?: any;
    stock: number;
    categoryId: number;
    createdAt: Date;
}

export interface OrderResponse {
    id: number;
    total: string | number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    shippingAddress: any;
    createdAt: Date;
    items?: any[];
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
