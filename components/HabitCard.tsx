"use client";

import { Habit } from "@/types/habit";
import { useHabits } from "@/context/HabitContext";
import { cn } from "@/lib/utils";
import { Check, Flame, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface HabitCardProps {
    habit: Habit;
}

export function HabitCard({ habit }: HabitCardProps) {
    const { toggleHabitCompletion, deleteHabit } = useHabits();

    const today = new Date().toISOString().split("T")[0];
    const isCompletedToday = habit.completedDates.includes(today);

    const [countdown, setCountdown] = useState<string | null>(null);

    useEffect(() => {
        if (!habit.timeOfDay || !isCompletedToday) {
            return;
        }

        const updateCountdown = () => {
            const now = new Date();
            const [hours, minutes] = habit.timeOfDay!.split(':').map(Number);

            const targetDate = new Date();
            targetDate.setHours(hours, minutes, 0, 0);

            if (targetDate.getTime() <= now.getTime()) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const diffMs = targetDate.getTime() - now.getTime();

            if (diffMs <= 0) {
                setCountdown("Sẵn sàng!");
                return;
            }

            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

            setCountdown(`${diffHrs}g ${diffMins}p ${diffSecs}s`);
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);

        return () => clearInterval(timer);
    }, [habit.timeOfDay, isCompletedToday]);

    return (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
            {/* Decorative side bar */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", habit.color)} />

            <div className="flex items-center justify-between pl-3">
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg leading-none tracking-tight">{habit.title}</h3>
                    {habit.description && (
                        <p className="text-sm text-muted-foreground">{habit.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="capitalize px-1.5 py-0.5 rounded-md bg-secondary border border-border/50">
                            {habit.frequency === 'daily' ? 'Hàng ngày' : habit.frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                        </span>
                        {habit.timeOfDay && (
                            <span className="flex items-center gap-1">
                                🕒 {habit.timeOfDay}
                            </span>
                        )}
                        {isCompletedToday && countdown && (
                            <span className="flex items-center gap-1 text-primary font-medium opacity-80">
                                ⌛ Tiếp theo trong {countdown}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Flame className="h-3 w-3 fill-amber-500" />
                            <span>Chuỗi {habit.streak} ngày</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => toggleHabitCompletion(habit.id, today)}
                        className={cn(
                            "flex items-center justify-center p-4 rounded-full transition-all duration-300 border-2",
                            isCompletedToday
                                ? `${habit.color} border-transparent text-white shadow-[0_0_15px_rgba(0,0,0,0.2)] scale-110`
                                : "border-muted bg-secondary/50 text-muted-foreground hover:bg-secondary hover:border-muted-foreground/50"
                        )}
                        title={isCompletedToday ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
                    >
                        <Check className={cn("h-6 w-6 transition-transform", isCompletedToday ? "scale-100" : "scale-75")} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Delete button (visible on hover) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Bạn có chắc chắn muốn xóa thói quen này không?")) {
                        deleteHabit(habit.id);
                    }
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
