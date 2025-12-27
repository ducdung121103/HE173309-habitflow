"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHabits } from "@/context/HabitContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"; // Assuming Card components exist or use divs if not
import { Flame, Calendar, Award } from "lucide-react";

// Fallback to basic divs if Card components missing (safeguard)
// But based on 'components/ui' listing earlier, 'card.tsx' was NOT listed.
// So I should stick to standard HTML/Tailwind or create card.tsx.
// Let's stick to standard Tailwind for the layout to be safe and fast.

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const { habits } = useHabits();

    // Form state
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

    useEffect(() => {
        if (user) {
            setName(user.name);
            setAvatarUrl(user.avatar || "");
        }
    }, [user]);

    if (!user) return null; // Should be protected by layout

    const handleSave = () => {
        setSaveStatus("saving");
        setTimeout(() => {
            updateProfile({ name, avatar: avatarUrl });
            setSaveStatus("saved");
            setIsEditing(false);
            setTimeout(() => setSaveStatus("idle"), 2000);
        }, 500);
    };

    // Stats
    const totalHabits = habits.length;
    const activeStreaks = habits.filter(h => h.streak > 0).length;
    const totalStreakDays = habits.reduce((acc, h) => acc + h.streak, 0);

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Information */}
                <div className="flex-1 space-y-6">
                    <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
                        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5"></div>
                        <div className="px-6 pb-6 relative">
                            <div className="absolute -top-12">
                                <Avatar className="h-24 w-24 border-4 border-card">
                                    <AvatarImage src={avatarUrl} alt={name} />
                                    <AvatarFallback className="text-2xl font-bold bg-muted">{name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="pt-16 flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold">{user.name}</h1>
                                    <p className="text-muted-foreground">{user.email}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                    </p>
                                </div>
                                <Button
                                    variant={isEditing ? "outline" : "default"}
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? "Hủy" : "Chỉnh sửa"}
                                </Button>
                            </div>

                            {isEditing && (
                                <div className="mt-6 space-y-4 pt-6 border-t border-border animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Tên hiển thị</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="avatar">Avatar URL</Label>
                                        <Input
                                            id="avatar"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            placeholder="https://..."
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Dán link ảnh từ internet vào đây.
                                        </p>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button onClick={handleSave} disabled={saveStatus === "saving"}>
                                            {saveStatus === "saving" ? "Đang lưu..." : "Lưu Thay Đổi"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats Sidebar */}
                <div className="w-full md:w-80 space-y-6">
                    <div className="border border-border bg-card rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-500" /> Thành Tựu
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-md">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="cursor-default">
                                        <p className="text-sm font-medium">Thói Quen</p>
                                        <p className="text-xs text-muted-foreground">Đang theo dõi</p>
                                    </div>
                                </div>
                                <span className="font-bold text-xl">{totalHabits}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 rounded-md">
                                        <Flame className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Chuỗi Ngày</p>
                                        <p className="text-xs text-muted-foreground">Tổng cộng</p>
                                    </div>
                                </div>
                                <span className="font-bold text-xl">{totalStreakDays}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-md">
                                        <Award className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Active Streaks</p>
                                        <p className="text-xs text-muted-foreground">Đang duy trì</p>
                                    </div>
                                </div>
                                <span className="font-bold text-xl">{activeStreaks}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
