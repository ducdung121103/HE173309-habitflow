"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Notification } from "@/types/notification";
import { api } from "@/lib/api";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (n: Omit<Notification, "id" | "timestamp" | "read"> & { id?: string }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Load initial notifications on mount
    useEffect(() => {
        let isMounted = true;
        const loadInitial = async () => {
            const saved = localStorage.getItem("appointment_notifications");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (isMounted) setNotifications(parsed);
                } catch {
                    // Ignore parse error
                }
            }

            // Also fetch from API
            try {
                const apiList = await api.getNotifications();
                if (apiList && apiList.length > 0 && isMounted) {
                    const mapped: Notification[] = apiList.map((item: Record<string, unknown>) => ({
                        id: `api-${item.id as number}`,
                        appointmentId: item.appointmentId as number | undefined,
                        type: (item.type === "Reminder" ? "reminder" : "appointment") as Notification["type"],
                        title: item.type === "Reminder" ? "Nhắc nhở lịch hẹn ⏰" : "Cập nhật lịch hẹn 🗓️",
                        message: String(item.message || ""),
                        timestamp: String(item.sentAt || new Date().toISOString()),
                        read: Boolean(item.isRead),
                        priority: "high"
                    }));

                    setNotifications(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const brandNew = mapped.filter(m => !existingIds.has(m.id));
                        const merged = [...brandNew, ...prev].slice(0, 30);
                        localStorage.setItem("appointment_notifications", JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (err) {
                console.warn("Could not fetch remote notifications:", err);
            }
        };

        loadInitial();
        return () => {
            isMounted = false;
        };
    }, []);

    const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read"> & { id?: string }) => {
        const newNotif: Notification = {
            id: n.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: n.title,
            message: n.message,
            type: n.type,
            appointmentId: n.appointmentId,
            habitId: n.habitId,
            priority: n.priority || "medium",
            timestamp: new Date().toISOString(),
            read: false
        };

        setNotifications(prev => {
            const updated = [newNotif, ...prev].slice(0, 30);
            localStorage.setItem("appointment_notifications", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            localStorage.setItem("appointment_notifications", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            localStorage.setItem("appointment_notifications", JSON.stringify(updated));
            return updated;
        });
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
