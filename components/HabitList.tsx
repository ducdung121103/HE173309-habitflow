"use client";

import { useHabits } from "@/context/HabitContext";
import { HabitCard } from "@/components/HabitCard";
import { AddHabitForm } from "@/components/AddHabitForm";

export function HabitList() {
    const { habits, loading } = useHabits();

    if (loading) {
        return <div className="text-center py-12 text-muted-foreground">Đang tải danh sách...</div>;
    }

    if (habits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                <h3 className="text-xl font-semibold mb-2">Chưa có thói quen nào</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    Bắt đầu hành trình bằng cách thêm thói quen đầu tiên.
                    Những bước nhỏ sẽ dẫn đến thay đổi lớn!
                </p>
                <AddHabitForm />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Thói Quen Của Bạn</h2>
                <AddHabitForm />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habits.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} />
                ))}
            </div>
        </div>
    );
}
