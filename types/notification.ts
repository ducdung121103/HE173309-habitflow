export type NotificationType = "reminder" | "risk" | "milestone" | "achievement" | "success";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    habitId?: string;
    priority?: "low" | "medium" | "high";
}
