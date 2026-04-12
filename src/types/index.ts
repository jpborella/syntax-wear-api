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