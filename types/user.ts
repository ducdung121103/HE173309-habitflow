export type UserRole = "Customer" | "Staff" | "Admin";

export interface User {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    role?: UserRole;
    avatar?: string;
    createdAt?: string;
}
