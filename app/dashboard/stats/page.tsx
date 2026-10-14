"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Calendar, DollarSign, CheckCircle2, Clock, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DashboardStats, Appointment, ServiceItem } from "@/types/appointment";

export default function StatsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sData, aData, svData] = await Promise.all([
                api.getDashboardStats(),
                api.getAppointments(),
                api.getServices()
            ]);
            setStats(sData);
            setAppointments(aData);
            setServices(svData);
        } catch (err) {
            console.error("Lỗi tải thống kê:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const total = stats?.totalAppointments ?? appointments.length;
    const completed = stats?.completedCount ?? appointments.filter(a => a.status === "Completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1">Thống Kê & Báo Cáo Lịch Hẹn</h1>
                        <p className="text-muted-foreground text-sm">
                            Trực quan hóa khối lượng lịch hẹn, tỷ lệ hoàn thành và doanh thu hệ thống.
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Tổng Lịch Hẹn</span>
                        <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-extrabold">{total}</div>
                    <p className="text-xs text-muted-foreground mt-1">Toàn bộ hồ sơ đặt lịch</p>
                </div>

                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Tỷ Lệ Hoàn Thành</span>
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-500">{completionRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">{completed} lịch đã khám thành công</p>
                </div>

                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Chờ & Xác Nhận</span>
                        <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-amber-500">
                        {(stats?.pendingCount ?? 0) + (stats?.confirmedCount ?? 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Đang trong tiến trình phục vụ</p>
                </div>

                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Tổng Doanh Thu</span>
                        <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-2xl font-extrabold text-primary">
                        {(stats?.totalRevenue ?? 0).toLocaleString("vi-VN")} đ
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Từ các dịch vụ đã đăng ký</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Breakdown by Service */}
                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">Phân Bố Theo Dịch Vụ</h3>
                    <div className="space-y-4">
                        {services.map(svc => {
                            const count = appointments.filter(a => a.serviceId === svc.id).length;
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                                <div key={svc.id} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{svc.name}</span>
                                        <span className="text-muted-foreground">{count} lịch ({pct}%)</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Breakdown by Status */}
                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">Trạng Thái Lịch Khám</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4 text-amber-500" /> Chờ duyệt (Pending)
                            </span>
                            <span className="font-bold text-amber-500">{stats?.pendingCount ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Đã xác nhận (Confirmed)
                            </span>
                            <span className="font-bold text-emerald-500">{stats?.confirmedCount ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4 text-sky-500" /> Hoàn thành (Completed)
                            </span>
                            <span className="font-bold text-sky-500">{stats?.completedCount ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <XCircle className="h-4 w-4 text-rose-500" /> Đã hủy (Cancelled)
                            </span>
                            <span className="font-bold text-rose-500">{stats?.cancelledCount ?? 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
