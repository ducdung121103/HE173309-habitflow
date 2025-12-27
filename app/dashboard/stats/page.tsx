"use client";

import { useHabits } from "@/context/HabitContext";
import { TrendingUp, Award, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function StatsPage() {
    const { habits } = useHabits();

    // Basic stats calculation
    const totalHabits = habits.length;
    const totalStreaks = habits.reduce((acc, h) => acc + h.streak, 0);
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

    // Calculate completion rate (naive)
    const totalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
    // Assume generic denominator for demo purposes or average

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Thống Kê Chi Tiết</h1>
                    <p className="text-muted-foreground">Trực quan hóa hành trình và thành tựu của bạn.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Thói Quen Đang Duy Trì"
                    value={totalHabits}
                    icon={<Calendar className="h-5 w-5 text-blue-500" />}
                    Trend="Tổng số thói quen đang theo dõi"
                />
                <StatsCard
                    title="Tổng Số Chuỗi"
                    value={totalStreaks}
                    icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                    Trend="Tổng ngày chuỗi của tất cả thói quen"
                />
                <StatsCard
                    title="Chuỗi Dài Nhất"
                    value={longestStreak}
                    icon={<Award className="h-5 w-5 text-yellow-500" />}
                    Trend="Chuỗi liên tục dài nhất hiện tại"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="border border-border rounded-xl p-6 bg-card">
                    <h3 className="font-semibold text-lg mb-4">Hiệu Suất Thói Quen</h3>
                    <div className="space-y-4">
                        {habits.map(habit => (
                            <div key={habit.id} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{habit.title}</span>
                                    <span className="text-muted-foreground">Chuỗi {habit.streak} ngày</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${habit.color}`}
                                        style={{ width: `${Math.min(habit.streak * 5, 100)}%` }} // Mock progress
                                    />
                                </div>
                            </div>
                        ))}
                        {habits.length === 0 && <p className="text-muted-foreground text-sm">Chưa có dữ liệu hiệu suất để hiển thị.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, Trend }: { title: string; value: number; icon: React.ReactNode; Trend: string }) {
    return (
        <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className="p-2 bg-secondary/50 rounded-lg">{icon}</div>
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <p className="text-xs text-muted-foreground">{Trend}</p>
        </div>
    )
}
