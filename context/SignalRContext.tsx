"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { Appointment } from "@/types/appointment";

export type SignalRConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected";

export interface SignalRToast {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    timestamp: Date;
}

interface SignalRContextType {
    status: SignalRConnectionStatus;
    lastEvent: { name: string; data: unknown; time: Date } | null;
    toasts: SignalRToast[];
    removeToast: (id: string) => void;
    subscribeToUpdates: (callback: (eventName: string, payload: unknown) => void) => () => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

const HUB_URL = process.env.NEXT_PUBLIC_SIGNALR_URL || "http://localhost:5000/hubs/appointments";

export function SignalRProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<SignalRConnectionStatus>("disconnected");
    const [lastEvent, setLastEvent] = useState<{ name: string; data: unknown; time: Date } | null>(null);
    const [toasts, setToasts] = useState<SignalRToast[]>([]);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const subscribersRef = useRef<Set<(eventName: string, payload: unknown) => void>>(new Set());

    const addToast = useCallback((title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: SignalRToast = {
            id,
            title,
            message,
            type,
            timestamp: new Date()
        };
        setToasts(prev => [newToast, ...prev].slice(0, 5));

        // Auto remove toast after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const notifySubscribers = useCallback((eventName: string, payload: unknown) => {
        subscribersRef.current.forEach(cb => {
            try {
                cb(eventName, payload);
            } catch (err) {
                console.error("SignalR subscriber error:", err);
            }
        });
    }, []);

    const subscribeToUpdates = useCallback((callback: (eventName: string, payload: unknown) => void) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    useEffect(() => {
        // Prevent SSR issues
        if (typeof window === "undefined") return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connectionRef.current = connection;

        connection.onreconnecting(() => {
            setStatus("reconnecting");
            console.log("🔄 SignalR: Đang kết nối lại...");
        });

        connection.onreconnected(() => {
            setStatus("connected");
            console.log("✅ SignalR: Đã kết nối lại thành công!");
            addToast("Đã kết nối lại", "Kênh thời gian thực SignalR đã được khôi phục.", "success");
        });

        connection.onclose(() => {
            setStatus("disconnected");
            console.log("⚠️ SignalR: Mất kết nối tới máy chủ.");
        });

        // ── Real-time Event Handlers ──
        connection.on("ReceiveAppointmentUpdate", (appointment: Appointment) => {
            setLastEvent({ name: "ReceiveAppointmentUpdate", data: appointment, time: new Date() });
            addToast("Cập nhật Lịch hẹn", `Lịch hẹn #${appointment.id} (${appointment.serviceName}) đã được cập nhật!`, "info");
            notifySubscribers("ReceiveAppointmentUpdate", appointment);
        });

        connection.on("ReceiveNewAppointment", (appointment: Appointment) => {
            setLastEvent({ name: "ReceiveNewAppointment", data: appointment, time: new Date() });
            addToast("Lịch hẹn mới", `Khách hàng ${appointment.customerName} vừa đặt hẹn lúc ${appointment.startTime}!`, "success");
            notifySubscribers("ReceiveNewAppointment", appointment);
        });

        connection.on("ReceiveStatusChange", (appointmentId: number, statusChange: string, message?: string) => {
            setLastEvent({ name: "ReceiveStatusChange", data: { appointmentId, status: statusChange, message }, time: new Date() });
            addToast("Thay đổi trạng thái", message || `Lịch hẹn #${appointmentId} chuyển sang trạng thái: ${statusChange}`, "info");
            notifySubscribers("ReceiveStatusChange", { appointmentId, status: statusChange, message });
        });

        connection.on("ReceiveCancellation", (appointmentId: number, reason?: string) => {
            setLastEvent({ name: "ReceiveCancellation", data: { appointmentId, reason }, time: new Date() });
            addToast("Hủy lịch hẹn", `Lịch hẹn #${appointmentId} đã bị hủy: ${reason || "Không có lý do"}`, "warning");
            notifySubscribers("ReceiveCancellation", { appointmentId, reason });
        });

        connection.on("NewReminderNotification", (notification: { id?: number; message?: string }) => {
            setLastEvent({ name: "NewReminderNotification", data: notification, time: new Date() });
            addToast("Nhắc nhở lịch hẹn", notification?.message || "Bạn có một lịch hẹn sắp tới!", "info");
            notifySubscribers("NewReminderNotification", notification);
        });

        // Connect
        const startConnection = async () => {
            setStatus("connecting");
            try {
                await connection.start();
                setStatus("connected");
                console.log("🚀 SignalR: Kết nối Hub thành công tới", HUB_URL);
            } catch (err) {
                setStatus("disconnected");
                console.warn("⚠️ SignalR: Chưa thể kết nối tới Hub (Backend có thể đang khởi động):", err);
            }
        };

        startConnection();

        return () => {
            connection.stop().catch(() => {});
        };
    }, [addToast, notifySubscribers]);

    return (
        <SignalRContext.Provider value={{ status, lastEvent, toasts, removeToast, subscribeToUpdates }}>
            {children}
            {/* Real-time Toast Overlay */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 ${
                            toast.type === "success"
                                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-100"
                                : toast.type === "warning"
                                ? "bg-amber-950/80 border-amber-500/40 text-amber-100"
                                : toast.type === "error"
                                ? "bg-rose-950/80 border-rose-500/40 text-rose-100"
                                : "bg-sky-950/80 border-sky-500/40 text-sky-100"
                        }`}
                    >
                        <div className="flex justify-between items-start gap-2">
                            <h5 className="font-semibold text-sm leading-tight">{toast.title}</h5>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-xs opacity-70 hover:opacity-100"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs mt-1 opacity-90 leading-relaxed">{toast.message}</p>
                    </div>
                ))}
            </div>
        </SignalRContext.Provider>
    );
}

export function useSignalR() {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error("useSignalR must be used within a SignalRProvider");
    }
    return context;
}
