"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Habit } from "@/types/habit";

interface HabitContextType {
    habits: Habit[];
    addHabit: (habit: Omit<Habit, "id" | "createdAt" | "completedDates" | "streak">) => void;
    toggleHabitCompletion: (id: string, date: string) => void;
    deleteHabit: (id: string) => void;
    loading: boolean;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem("habitflow_habits");
        if (saved) {
            try {
                setHabits(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load habits", e);
            }
        }
        setLoading(false);
    }, []);

    // Save to local storage
    useEffect(() => {
        if (!loading) {
            localStorage.setItem("habitflow_habits", JSON.stringify(habits));
        }
    }, [habits, loading]);

    const addHabit = (data: Omit<Habit, "id" | "createdAt" | "completedDates" | "streak">) => {
        const newHabit: Habit = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            completedDates: [],
            streak: 0,
        };
        setHabits((prev) => [...prev, newHabit]);
    };

    const calculateStreak = (dates: string[]): number => {
        if (dates.length === 0) return 0;

        // Sort dates descending
        const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // If not completed today or yesterday, streak is broken (0), unless checking for *current* streak where today might not be done yet.
        // However, simplest logic: count consecutive days backwards from today/yesterday.

        let currentStreak = 0;
        let checkDate = new Date();

        // Normalize to YYYY-MM-DD
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        // Check if latest completion is today or yesterday
        const latest = sortedDates[0];
        if (latest !== formatDate(checkDate) && latest !== formatDate(new Date(Date.now() - 86400000))) {
            return 0;
        }

        // Naive streak calc for demo: just simpler one
        // Actually, let's just count consecutive days present in the array going back from latest
        let streak = 0;
        let lastDateObj = new Date(latest);

        for (const dateStr of sortedDates) {
            // logic here can be complex due to gaps, but for MVP let's trust the array is correct or we re-verify
            // Actually simpler: 
            // If day[i] is 1 day before day[i-1], streak++
            // We start from the most recent date.
            if (streak === 0) {
                streak = 1;
                continue;
            }

            const current = new Date(dateStr);
            const diffTime = Math.abs(lastDateObj.getTime() - current.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
                lastDateObj = current;
            } else {
                break;
            }
        }

        return streak;
    };

    const toggleHabitCompletion = (id: string, date: string) => {
        setHabits((prev) =>
            prev.map((habit) => {
                if (habit.id !== id) return habit;

                const isCompleted = habit.completedDates.includes(date);
                let newDates;
                if (isCompleted) {
                    newDates = habit.completedDates.filter((d) => d !== date);
                } else {
                    newDates = [...habit.completedDates, date];
                }

                // Recalculate streak
                const newStreak = calculateStreak(newDates);

                return {
                    ...habit,
                    completedDates: newDates,
                    streak: newStreak,
                };
            })
        );
    };

    const deleteHabit = (id: string) => {
        setHabits((prev) => prev.filter((h) => h.id !== id));
    };

    return (
        <HabitContext.Provider value={{ habits, addHabit, toggleHabitCompletion, deleteHabit, loading }}>
            {children}
        </HabitContext.Provider>
    );
}

export function useHabits() {
    const context = useContext(HabitContext);
    if (!context) {
        throw new Error("useHabits must be used within a HabitProvider");
    }
    return context;
}
