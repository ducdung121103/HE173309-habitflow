"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardStats } from "@/types/appointment";

export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [phone, setPhone] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setAvatarUrl(user.avatar || "");
            setPhone(user.phone || "");
        }
        api.getDashboardStats().then(setStats).catch(() => {});
    }, [user]);

    if (!user) return null;

    const handleSave = () => {
        setSaveStatus("saving");
        setTimeout(() => {
            updateProfile({ name, avatar: avatarUrl, phone });
            setSaveStatus("saved");
            setIsEditing(false);
            setTimeout(() => setSaveStatus("idle"), 2000);
        }, 500);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Information */}
                <div className="flex-1 space-y-6">
                    <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
                        <div className="h-32 bg-gradient-to-r from-primary/20 via-blue-500/10 to-indigo-500/20" />
                        <div className="px-6 pb-6 relative">
                            <div className="absolute -top-12">
                                <Avatar className="h-24 w-24 border-4 border-card shadow-md">
                                    <AvatarImage src={avatarUrl} alt={name} />
                                    <AvatarFallback className="text-2xl font-bold bg-muted">{name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="pt-16 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold">{user.name}</h1>
                                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                            {user.role || "Customer"}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">{user.email}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Điện thoại: {user.phone || "Chưa cập nhật"}
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
                                        <Label htmlFor="phone">Số điện thoại</Label>
                                        <Input
                                            id="phone"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="0901234567"
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
                            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Tổng Quan Hồ Sơ
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-md">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Tổng lịch hẹn</p>
                                        <p className="text-xs text-muted-foreground">Trên hệ thống</p>
                                    </div>
                                </div>
                                <span className="font-bold text-xl">{stats?.totalAppointments ?? 0}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-md">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Đã xác nhận</p>
                                        <p className="text-xs text-muted-foreground">Sắp tới</p>
                                    </div>
                                </div>
                                <span className="font-bold text-xl">{stats?.confirmedCount ?? 0}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-md">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Chờ duyệt</p>
                                        <p className="text-xs text-muted-foreground">Cần xử lý</p>
                                    </div>
                                </div>
                                <span className="font-bold text-xl">{stats?.pendingCount ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
