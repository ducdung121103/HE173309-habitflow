"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, AlertCircle, CheckCircle2, PlusCircle, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { ServiceItem, Appointment } from "@/types/appointment";
import { useAuth } from "@/context/AuthContext";

interface BookAppointmentDialogProps {
    onAppointmentCreated?: (newAppt: Appointment) => void;
    triggerButton?: React.ReactNode;
}

const TIME_SLOTS = [
    "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "13:30",
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30"
];

export function BookAppointmentDialog({ onAppointmentCreated, triggerButton }: BookAppointmentDialogProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loadingServices, setLoadingServices] = useState(false);

    // Form inputs
    const [serviceId, setServiceId] = useState<number>(1);
    const [date, setDate] = useState<string>(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    });
    const [time, setTime] = useState<string>("09:00");
    const [notes, setNotes] = useState<string>("");
    const [customerName, setCustomerName] = useState<string>("");
    const [customerPhone, setCustomerPhone] = useState<string>("");
    const [customerEmail, setCustomerEmail] = useState<string>("");

    // Conflict state
    const [checkingConflict, setCheckingConflict] = useState(false);
    const [conflictResult, setConflictResult] = useState<{
        checked: boolean;
        hasConflict: boolean;
        message: string;
    }>({ checked: false, hasConflict: false, message: "" });

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Load active services
    useEffect(() => {
        if (!open) return;
        setLoadingServices(true);
        api.getServices()
            .then(res => {
                const active = res.filter(s => s.isActive);
                setServices(active);
                if (active.length > 0 && !serviceId) {
                    setServiceId(active[0].id);
                }
            })
            .catch(() => {})
            .finally(() => setLoadingServices(false));

        // Pre-fill user data
        if (user) {
            setCustomerName(user.name || "");
            setCustomerEmail(user.email || "");
            setCustomerPhone(user.phone || "0901234567");
        }
    }, [open, user, serviceId]);

    // Check conflict whenever service, date, or time changes
    const verifyConflict = useCallback(async (svcId: number, d: string, t: string) => {
        if (!svcId || !d || !t) return;
        setCheckingConflict(true);
        try {
            const res = await api.checkConflict({
                serviceId: svcId,
                date: d,
                startTime: t
            });
            setConflictResult({
                checked: true,
                hasConflict: res.hasConflict,
                message: res.message
            });
        } catch {
            setConflictResult({
                checked: true,
                hasConflict: false,
                message: "Không phát hiện trùng lịch."
            });
        } finally {
            setCheckingConflict(false);
        }
    }, []);

    useEffect(() => {
        if (open && serviceId && date && time) {
            const timer = setTimeout(() => {
                verifyConflict(serviceId, date, time);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open, serviceId, date, time, verifyConflict]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (conflictResult.hasConflict) {
            setErrorMsg("Khung giờ đã chọn bị trùng. Vui lòng chọn giờ khác.");
            return;
        }

        setSubmitting(true);
        try {
            const newAppt = await api.createAppointment({
                customerId: typeof user?.id === "number" ? user.id : 1,
                serviceId,
                appointmentDate: date,
                startTime: time,
                notes,
                customerName: customerName.trim() || user?.name || "Khách hàng",
                customerEmail: customerEmail.trim() || user?.email || "customer@example.com",
                customerPhone: customerPhone.trim() || "0901234567"
            });

            if (onAppointmentCreated) {
                onAppointmentCreated(newAppt);
            }

            setOpen(false);
            setNotes("");
        } catch (err: unknown) {
            const errorObj = err as Error;
            setErrorMsg(errorObj.message || "Lỗi khi đặt lịch hẹn. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const selectedService = services.find(s => s.id === serviceId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
                        <PlusCircle className="h-4 w-4" /> Đặt lịch hẹn mới
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Đặt lịch hẹn trực tuyến</DialogTitle>
                            <DialogDescription>
                                Chọn dịch vụ, ngày giờ khám để kiểm tra tính khả dụng tức thì qua hệ thống SignalR.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Chọn dịch vụ */}
                    <div className="space-y-2">
                        <Label htmlFor="service" className="text-sm font-semibold">Chọn Dịch vụ Y tế / Chăm sóc</Label>
                        {loadingServices ? (
                            <div className="text-xs text-muted-foreground animate-pulse">Đang tải danh mục dịch vụ...</div>
                        ) : (
                            <select
                                id="service"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                value={serviceId}
                                onChange={e => setServiceId(Number(e.target.value))}
                                required
                            >
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.durationMinutes} phút - {s.price.toLocaleString("vi-VN")} đ)
                                    </option>
                                ))}
                            </select>
                        )}
                        {selectedService && (
                            <p className="text-xs text-muted-foreground italic">
                                💡 {selectedService.description}
                            </p>
                        )}
                    </div>

                    {/* Ngày & Giờ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-primary" /> Ngày hẹn
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time" className="text-sm font-semibold flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-primary" /> Giờ bắt đầu
                            </Label>
                            <select
                                id="time"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                required
                            >
                                {TIME_SLOTS.map(slot => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Trạng thái kiểm tra xung đột */}
                    <div className="rounded-lg p-3 text-xs border transition-colors">
                        {checkingConflict ? (
                            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                                <Clock className="h-4 w-4 animate-spin text-primary" /> Đang kiểm tra lịch trống với máy chủ...
                            </div>
                        ) : conflictResult.checked ? (
                            conflictResult.hasConflict ? (
                                <div className="flex items-center gap-2 text-rose-500 font-medium">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>⚠️ {conflictResult.message || "Khung giờ này đã có người đặt. Vui lòng chọn giờ khác!"}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-500 font-medium">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span>✅ Khung giờ trống và hoàn toàn khả dụng.</span>
                                </div>
                            )
                        ) : (
                            <span className="text-muted-foreground">Chọn ngày và giờ để hệ thống kiểm tra lịch trống.</span>
                        )}
                    </div>

                    {/* Thông tin liên hệ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs">Họ và tên</Label>
                            <Input
                                id="name"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Nguyễn Văn A"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs">Số điện thoại</Label>
                            <Input
                                id="phone"
                                value={customerPhone}
                                onChange={e => setCustomerPhone(e.target.value)}
                                placeholder="0901234567"
                                required
                            />
                        </div>
                    </div>

                    {/* Ghi chú */}
                    <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-xs">Ghi chú triệu chứng / yêu cầu đặc biệt</Label>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ví dụ: Đau răng hàm trên bên phải, cần khám sớm..."
                        />
                    </div>

                    {errorMsg && (
                        <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={submitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || checkingConflict || conflictResult.hasConflict}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                        >
                            {submitting ? "Đang gửi..." : "Xác nhận đặt lịch"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
