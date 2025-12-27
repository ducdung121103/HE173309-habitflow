"use client";

import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>;
    }

    if (!user) return null; // Will redirect

    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <section className="container max-w-screen-2xl mx-auto px-4 md:px-8 py-8 pt-20">
                {children}
            </section>
        </main>
    );
}

