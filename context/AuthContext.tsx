"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "@/types/user";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password?: string, role?: UserRole) => Promise<void>;
    signup: (name: string, email: string, phone?: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    switchRole: (role: UserRole) => void;
}

const defaultDemoUser: User = {
    id: 1,
    name: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    phone: "0901234567",
    role: "Customer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnNguyen",
    createdAt: new Date().toISOString()
};

const demoAccounts: Record<UserRole, User> = {
    Customer: {
        id: 1,
        name: "Nguyễn Văn An",
        email: "an.nguyen@example.com",
        phone: "0901234567",
        role: "Customer",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AnNguyen",
        createdAt: new Date().toISOString()
    },
    Staff: {
        id: 1,
        name: "Bác sĩ Trần Thị Bình",
        email: "binh.tran@example.com",
        phone: "0912345678",
        role: "Staff",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DrBinh",
        createdAt: new Date().toISOString()
    },
    Admin: {
        id: 99,
        name: "Quản trị viên Hệ thống",
        email: "admin@example.com",
        phone: "0988888888",
        role: "Admin",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
        createdAt: new Date().toISOString()
    }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(defaultDemoUser);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedUser = localStorage.getItem("appointment_user") || localStorage.getItem("habitflow_user");
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                setUser(defaultDemoUser);
            }
        } else {
            setUser(defaultDemoUser);
            localStorage.setItem("appointment_user", JSON.stringify(defaultDemoUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, _password = "", role: UserRole = "Customer") => {
        // Match demo accounts
        const foundDemo = Object.values(demoAccounts).find(a => a.email.toLowerCase() === email.toLowerCase());
        if (foundDemo) {
            setUser(foundDemo);
            localStorage.setItem("appointment_user", JSON.stringify(foundDemo));
            return;
        }

        const newUser: User = {
            id: Math.floor(Math.random() * 1000) + 10,
            name: email.split("@")[0],
            email,
            role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
            createdAt: new Date().toISOString()
        };

        setUser(newUser);
        localStorage.setItem("appointment_user", JSON.stringify(newUser));
    };

    const signup = async (name: string, email: string, phone = "0900000000") => {
        const newUser: User = {
            id: Math.floor(Math.random() * 1000) + 10,
            name,
            email,
            phone,
            role: "Customer",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            createdAt: new Date().toISOString()
        };
        setUser(newUser);
        localStorage.setItem("appointment_user", JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("appointment_user");
        router.push("/login");
    };

    const updateProfile = (data: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem("appointment_user", JSON.stringify(updatedUser));
    };

    const switchRole = (role: UserRole) => {
        const target = demoAccounts[role];
        setUser(target);
        localStorage.setItem("appointment_user", JSON.stringify(target));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, switchRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
