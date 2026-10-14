"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    CheckCheck,
    Wifi,
    WifiOff,
    RefreshCw,
    Search,
    DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { api } from "@/lib/api";
import { Appointment, DashboardStats } from "@/types/appointment";
import { useSignalR } from "@/context/SignalRContext";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/user";

export default function DashboardPage() {
    const { status: signalRStatus, subscribeToUpdates } = useSignalR();
    const { user, switchRole } = useAuth();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [apptData, statsData] = await Promise.all([
                api.getAppointments(activeFilter === "All" ? undefined : activeFilter),
                api.getDashboardStats()
            ]);
            setAppointments(apptData);
            setStats(statsData);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu dashboard:", err);
        } finally {
            setLoading(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Lắng nghe SignalR event để tự động refresh giao diện real-time
    useEffect(() => {
        const unsubscribe = subscribeToUpdates((eventName, payload) => {
            console.log(`[Dashboard] Nhận sự kiện SignalR: ${eventName}`, payload);
            loadData();
        });
        return unsubscribe;
    }, [subscribeToUpdates, loadData]);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        setActionLoadingId(id);
        try {
            const staffId = user?.role === "Staff" && typeof user.id === "number" ? user.id : 1;
            await api.updateStatus(id, newStatus, staffId);
            await loadData();
        } catch (err: unknown) {
            const e = err as Error;
            alert(`Lỗi cập nhật: ${e.message || "Vui lòng thử lại"}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredAppointments = appointments.filter(a => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            a.customerName.toLowerCase().includes(q) ||
            a.customerPhone.includes(q) ||
            a.serviceName.toLowerCase().includes(q) ||
            (a.staffName && a.staffName.toLowerCase().includes(q))
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "confirmed":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Đã xác nhận
                    </span>
                );
            case "completed":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/20">
                        <CheckCheck className="h-3 w-3" /> Hoàn thành
                    </span>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <XCircle className="h-3 w-3" /> Đã hủy
                    </span>
                );
            case "pending":
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="h-3 w-3" /> Chờ duyệt
                    </span>
                );
        }
    };

    return (
        <div className="space-y-8">
            {/* Top Bar: Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        Hệ thống Lịch Hẹn
                        {signalRStatus === "connected" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <Wifi className="h-3.5 w-3.5" /> SignalR Real-time Online
                            </span>
                        ) : signalRStatus === "reconnecting" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang kết nối lại Hub...
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-500/15 text-zinc-600 border border-zinc-500/30">
                                <WifiOff className="h-3.5 w-3.5" /> Ngoại tuyến (Offline Mode)
                            </span>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Quản lý đặt lịch, duyệt lịch khám và đồng bộ dữ liệu thời gian thực giữa Web, TCP Socket và Worker Service.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Demo Role Switcher */}
                    <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg border text-xs">
                        <span className="px-2 text-muted-foreground font-medium">Vai trò:</span>
                        {(["Customer", "Staff", "Admin"] as UserRole[]).map(r => (
                            <button
                                key={r}
                                onClick={() => switchRole(r)}
                                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                                    user?.role === r
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {r === "Customer" ? "Khách hàng" : r === "Staff" ? "Bác sĩ / Nhân viên" : "Admin"}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadData}
                        disabled={loading}
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>

                    <BookAppointmentDialog onAppointmentCreated={() => loadData()} />
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
                    <div className="text-xs font-medium text-muted-foreground">Tổng số lịch</div>
                    <div className="text-2xl font-bold mt-1">{stats?.totalAppointments ?? appointments.length}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Toàn bộ hồ sơ</div>
                </div>

                <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm border-amber-500/20">
                    <div className="text-xs font-medium text-amber-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Chờ duyệt
                    </div>
                    <div className="text-2xl font-bold text-amber-500 mt-1">
                        {stats?.pendingCount ?? appointments.filter(a => a.status === "Pending").length}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Cần nhân viên duyệt</div>
                </div>

                <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm border-emerald-500/20">
                    <div className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác nhận
                    </div>
                    <div className="text-2xl font-bold text-emerald-500 mt-1">
                        {stats?.confirmedCount ?? appointments.filter(a => a.status === "Confirmed").length}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Sẵn sàng phục vụ</div>
                </div>

                <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm border-sky-500/20">
                    <div className="text-xs font-medium text-sky-500 flex items-center gap-1">
                        <CheckCheck className="h-3.5 w-3.5" /> Hoàn thành
                    </div>
                    <div className="text-2xl font-bold text-sky-500 mt-1">
                        {stats?.completedCount ?? appointments.filter(a => a.status === "Completed").length}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Đã khám xong</div>
                </div>

                <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm border-rose-500/20">
                    <div className="text-xs font-medium text-rose-500 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Đã hủy
                    </div>
                    <div className="text-2xl font-bold text-rose-500 mt-1">
                        {stats?.cancelledCount ?? appointments.filter(a => a.status === "Cancelled").length}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Lịch đã hủy bỏ</div>
                </div>

                <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm border-primary/20">
                    <div className="text-xs font-medium text-primary flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> Doanh thu
                    </div>
                    <div className="text-xl font-bold text-primary mt-1">
                        {(stats?.totalRevenue ?? 0).toLocaleString("vi-VN")} đ
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Dự kiến & thực thu</div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(f => (
                        <Button
                            key={f}
                            variant={activeFilter === f ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveFilter(f)}
                            className="text-xs font-medium whitespace-nowrap"
                        >
                            {f === "All"
                                ? "Tất cả"
                                : f === "Pending"
                                ? "⏳ Chờ duyệt"
                                : f === "Confirmed"
                                ? "✅ Đã xác nhận"
                                : f === "Completed"
                                ? "🏁 Hoàn thành"
                                : "❌ Đã hủy"}
                        </Button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm khách hàng, số ĐT, dịch vụ..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 text-xs"
                    />
                </div>
            </div>

            {/* Appointments Table / Cards */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground space-y-2">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                        <p className="text-sm">Đang tải danh sách lịch hẹn...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground space-y-3">
                        <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50" />
                        <p className="text-base font-medium">Không tìm thấy lịch hẹn nào phù hợp</p>
                        <p className="text-xs">Hãy tạo lịch hẹn mới bằng nút &quot;Đặt lịch hẹn mới&quot; ở trên.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40 border-b text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3">Mã</th>
                                    <th className="px-4 py-3">Khách hàng</th>
                                    <th className="px-4 py-3">Dịch vụ & Giá</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                    <th className="px-4 py-3">Bác sĩ phụ trách</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredAppointments.map(appt => (
                                    <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-xs text-muted-foreground">
                                            #{appt.id}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-foreground">{appt.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{appt.customerPhone}</div>
                                            {appt.notes && (
                                                <div className="text-[11px] text-muted-foreground/80 italic mt-0.5">
                                                    💬 {appt.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">{appt.serviceName}</div>
                                            <div className="text-xs text-primary font-semibold">
                                                {appt.servicePrice.toLocaleString("vi-VN")} đ
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                {new Date(appt.appointmentDate).toLocaleDateString("vi-VN")}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3" />
                                                {appt.startTime} - {appt.endTime}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {appt.staffName ? (
                                                <span className="font-medium text-foreground">{appt.staffName}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic">Chưa chỉ định</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(appt.status)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {appt.status === "Pending" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
                                                            disabled={actionLoadingId === appt.id}
                                                            onClick={() => handleUpdateStatus(appt.id, "Confirmed")}
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Duyệt
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-500/30"
                                                            disabled={actionLoadingId === appt.id}
                                                            onClick={() => handleUpdateStatus(appt.id, "Cancelled")}
                                                        >
                                                            <XCircle className="h-3.5 w-3.5 mr-1" /> Hủy
                                                        </Button>
                                                    </>
                                                )}
                                                {appt.status === "Confirmed" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-500/10 border-sky-500/30"
                                                            disabled={actionLoadingId === appt.id}
                                                            onClick={() => handleUpdateStatus(appt.id, "Completed")}
                                                        >
                                                            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Hoàn thành
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs text-rose-500 hover:bg-rose-500/10 border-rose-500/20"
                                                            disabled={actionLoadingId === appt.id}
                                                            onClick={() => handleUpdateStatus(appt.id, "Cancelled")}
                                                        >
                                                            Hủy
                                                        </Button>
                                                    </>
                                                )}
                                                {(appt.status === "Completed" || appt.status === "Cancelled") && (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Đã đóng
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
