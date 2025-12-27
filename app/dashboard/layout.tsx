"use client";

import { Navbar } from "@/components/Navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-12">
                {children}
            </div>
        </main>
    );
}
