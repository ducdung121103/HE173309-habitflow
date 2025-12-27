"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string) => Promise<void>;
    signup: (name: string, email: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load user from local storage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem("habitflow_user");
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user data", e);
                localStorage.removeItem("habitflow_user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string) => {
        // Simulating API call
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                // In a real app, we would verify password here.
                // For this demo, we check if any "users" exist in our simulated DB
                // But simpler: we just check if there is a stored user matching this email
                // OR we can just allow login if we find a matching habit-store key?
                // Let's stick to the simplest "client-side auth":
                // If they have logged in before on this browser, good.
                // If not, maybe we should just "create" or "find" them.

                // Better approach for this "no backend" demo:
                // We'll look for a 'users_db' in localStorage
                const usersDbStr = localStorage.getItem("habitflow_users_db");
                const usersDb: User[] = usersDbStr ? JSON.parse(usersDbStr) : [];

                const foundUser = usersDb.find(u => u.email === email);

                if (foundUser) {
                    setUser(foundUser);
                    localStorage.setItem("habitflow_user", JSON.stringify(foundUser));
                    resolve();
                } else {
                    reject(new Error("Không tìm thấy tài khoản với email này."));
                }
            }, 1000);
        });
    };

    const signup = async (name: string, email: string) => {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                const usersDbStr = localStorage.getItem("habitflow_users_db");
                const usersDb: User[] = usersDbStr ? JSON.parse(usersDbStr) : [];

                if (usersDb.find(u => u.email === email)) {
                    reject(new Error("Email này đã được sử dụng."));
                    return;
                }

                const newUser: User = {
                    id: crypto.randomUUID(),
                    name,
                    email,
                    createdAt: new Date().toISOString(),
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
                };

                // Save to "DB"
                usersDb.push(newUser);
                localStorage.setItem("habitflow_users_db", JSON.stringify(usersDb));

                // Set session
                setUser(newUser);
                localStorage.setItem("habitflow_user", JSON.stringify(newUser));

                resolve();
            }, 1000);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("habitflow_user");
        router.push("/login"); // Explicit redirect
    };

    const updateProfile = (data: Partial<User>) => {
        if (!user) return;

        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem("habitflow_user", JSON.stringify(updatedUser)); // Update session

        // Update in "DB"
        const usersDbStr = localStorage.getItem("habitflow_users_db");
        if (usersDbStr) {
            const usersDb: User[] = JSON.parse(usersDbStr);
            const index = usersDb.findIndex(u => u.id === user.id);
            if (index !== -1) {
                usersDb[index] = updatedUser;
                localStorage.setItem("habitflow_users_db", JSON.stringify(usersDb));
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
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
