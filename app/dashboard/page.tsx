"use client";

import { HabitList } from "@/components/HabitList";

export default function DashboardPage() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">My Dashboard</h1>
                <p className="text-muted-foreground">Manage your daily routines and track your progress.</p>
            </div>

            <HabitList />
        </>
    );
}
