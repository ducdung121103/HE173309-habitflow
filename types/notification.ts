export type NotificationType =
    | "reminder"
    | "risk"
    | "milestone"
    | "achievement"
    | "success"
    | "appointment"
    | "status"
    | "StatusChanged"
    | "Reminder"
    | "NewAppointment";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    habitId?: string;
    appointmentId?: number;
    priority?: "low" | "medium" | "high";
}
