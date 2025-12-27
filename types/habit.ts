export type Frequency = "daily" | "weekly" | "monthly";

export interface Habit {
    id: string;
    title: string;
    description?: string;
    frequency: Frequency;
    timeOfDay?: string; // HH:mm format
    createdAt: string;
    completedDates: string[]; // ISO date strings YYYY-MM-DD
    streak: number;
    icon?: string; // Optional icon identifier
    color: string; // Hex or tailwind class
}

export interface UserStats {
    totalHabits: number;
    totalCompletions: number;
    currentLongestStreak: number;
    completionRate: number;
}
