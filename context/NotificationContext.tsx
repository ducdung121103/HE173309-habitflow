"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Notification } from "@/types/notification";
import { useHabits } from "@/context/HabitContext";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { habits, loading } = useHabits();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const prevHabitsRef = React.useRef(habits);
    const [storedNotifications, setStoredNotifications] = useState<Notification[]>([]);
    const initialLoadRef = React.useRef(true);

    // Load stored notifications on mount
    useEffect(() => {
        const stored = localStorage.getItem("habitflow_stored_notifications");
        if (stored) {
            try {
                setStoredNotifications(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored notifications");
            }
        }
    }, []);

    // Save stored notifications on change
    useEffect(() => {
        localStorage.setItem("habitflow_stored_notifications", JSON.stringify(storedNotifications));
    }, [storedNotifications]);

    // Logic to generate notifications based on habits
    useEffect(() => {
        if (loading) return;

        // Skip detection on initial load to prevent spam
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            prevHabitsRef.current = habits;
            return;
        }

        const prevHabits = prevHabitsRef.current;
        const newEvents: Notification[] = [];
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        // Detect New Habits
        habits.forEach(habit => {
            const isNew = !prevHabits.find(p => p.id === habit.id);
            if (isNew) {
                newEvents.push({
                    id: `new-${habit.id}-${Date.now()}`,
                    type: "success", // Will map to check/info icon
                    title: "Thói quen mới! ✨",
                    message: `Đã thêm thói quen "${habit.title}" thành công.`,
                    timestamp: now.toISOString(),
                    read: false,
                    habitId: habit.id,
                    priority: "medium"
                });
            } else {
                // Detect Streak Increase
                const prev = prevHabits.find(p => p.id === habit.id);
                if (prev && habit.streak > prev.streak) {
                    newEvents.push({
                        id: `streak-${habit.id}-${habit.streak}-${Date.now()}`,
                        type: "achievement",
                        title: "Cập Nhật Chuỗi! 🔥",
                        message: `Tuyệt vời! Bạn đã đạt chuỗi ${habit.streak} ngày cho "${habit.title}"!`,
                        timestamp: now.toISOString(),
                        read: false,
                        habitId: habit.id,
                        priority: "high"
                    });
                }
            }
        });

        if (newEvents.length > 0) {
            setStoredNotifications(prev => [...newEvents, ...prev]);
        }

        prevHabitsRef.current = habits;

        // --- Derived Notifications (Risks, Reminders) ---
        const derivedNotifications: Notification[] = [];

        habits.forEach((habit) => {
            const isCompletedToday = habit.completedDates.includes(today);

            // 1. Milestones (Keep existing logic or rely on event-based? 
            // The event based covers "Streak Updated" for every increase.
            // Milestones are special fixed points. Let's keep them as "Events" too? 
            // Actually, the previous logic acted like derived state (show as long as condition meets).
            // But notifications should probably be dismissable.
            // Let's keep Risks and Reminders as derived, everything else as Events.

            // 2. Risk Alerts (Streak Loss Warning)
            if (habit.frequency === "daily" && !isCompletedToday) {
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);
                // endOfDay.setHours(12, 0, 0, 0); // Testing logic if needed

                const hoursLeft = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);

                if (hoursLeft < 6 && hoursLeft > 0) {
                    const hoursRounded = Math.ceil(hoursLeft);
                    derivedNotifications.push({
                        id: `risk-${habit.id}-${today}`,
                        type: "risk",
                        title: "Cảnh Báo Mất Chuỗi! 🔥",
                        message: `Còn ${hoursRounded} giờ để duy trì chuỗi cho "${habit.title}"!`,
                        timestamp: now.toISOString(),
                        read: false,
                        habitId: habit.id,
                        priority: "high"
                    });
                }
            }

            // 3. Reminders based on timeOfDay
            if (habit.timeOfDay && !isCompletedToday) {
                const [h, m] = habit.timeOfDay.split(':').map(Number);
                const scheduleTime = new Date();
                scheduleTime.setHours(h, m, 0, 0);

                const diff = now.getTime() - scheduleTime.getTime();
                // If within last 2 hours and not done
                if (diff > 0 && diff < 2 * 60 * 60 * 1000) {
                    derivedNotifications.push({
                        id: `reminder-${habit.id}-${today}`,
                        type: "reminder",
                        title: "Nhắc Nhở ⏰",
                        message: `Đã đến giờ thực hiện "${habit.title}" (${habit.timeOfDay}).`,
                        timestamp: now.toISOString(),
                        read: false,
                        habitId: habit.id,
                        priority: "medium"
                    });
                }
            }
        });

        // Merge: Derived (always fresh) + Stored (persisted events)
        // We also need to apply "read" status to Derived ones if we want them to remain dismissed.
        // For simplicity, Derived ones are re-generated. If user "Dismisses" a risk, we should store that ID.

        const readIds = JSON.parse(localStorage.getItem("habitflow_read_notifications") || "[]");

        // Filter out read derived notifications? Or show as read?
        // Let's show as read if ID matches.

        const finalDerived = derivedNotifications.map(n => ({
            ...n,
            read: readIds.includes(n.id)
        }));

        // combine
        const all = [...storedNotifications, ...finalDerived];

        // Dedup by ID if necessary (shouldn't be, IDs are distinct categories)

        // Sort
        all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Apply read status to stored ones (already in state? No, storedNotifications just has raw data, read status might be separate or embedded)
        // Actually, let's embed read status in storedNotifications.
        // So for stored, we trust the state.

        // Wait, current markAsRead implementation:
        // setNotifications(prev => prev.map... read: true)
        // But here we are overwriting `notifications` every render in useEffect!
        // We need to update `storedNotifications` when markAsRead is called.
        // See updated markAsRead below.

        setNotifications(all);

    }, [habits, loading, storedNotifications]); // Dependency on storedNotifications might cause loop if we are not careful? No, mostly transactional.


    const markAsRead = (id: string) => {
        // 1. Update persisted read IDs (for derived ones)
        const readIds = JSON.parse(localStorage.getItem("habitflow_read_notifications") || "[]");
        if (!readIds.includes(id)) {
            localStorage.setItem("habitflow_read_notifications", JSON.stringify([...readIds, id]));
        }

        // 2. Update stored notifications state (for event ones)
        setStoredNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        // 3. For immediate UI feedback (optional since effect will run, but good for responsiveness)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        // Update all stored
        setStoredNotifications(prev => prev.map(n => ({ ...n, read: true })));

        // Update all derived IDs to local storage
        const derivedIds = notifications.filter(n => n.type === 'risk' || n.type === 'reminder').map(n => n.id);
        const readIds = JSON.parse(localStorage.getItem("habitflow_read_notifications") || "[]");
        const newReadIds = Array.from(new Set([...readIds, ...derivedIds]));
        localStorage.setItem("habitflow_read_notifications", JSON.stringify(newReadIds));

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
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
