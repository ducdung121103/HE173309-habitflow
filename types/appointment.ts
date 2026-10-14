export type AppointmentStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export interface Appointment {
    id: number;
    customerId: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    staffId?: number | null;
    staffName?: string;
    serviceId: number;
    serviceName: string;
    servicePrice: number;
    appointmentDate: string; // ISO date string or yyyy-MM-dd
    startTime: string;       // HH:mm
    endTime: string;         // HH:mm
    status: AppointmentStatus | string;
    statusVietnamese: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ServiceItem {
    id: number;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
}

export interface StaffItem {
    id: number;
    fullName: string;
    email: string;
    role: string;
}

export interface DashboardStats {
    totalAppointments: number;
    pendingCount: number;
    confirmedCount: number;
    completedCount: number;
    cancelledCount: number;
    upcomingTodayCount: number;
    todayCount?: number;
    totalRevenue: number;
}

export interface ConflictCheckRequest {
    date: string;
    startTime: string;
    serviceId: number;
    excludeAppointmentId?: number;
}

export interface ConflictCheckResponse {
    hasConflict: boolean;
    message: string;
    conflictingSlots: string[];
}

export interface CreateAppointmentRequest {
    customerId: number;
    serviceId: number;
    appointmentDate: string;
    startTime: string;
    notes?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}
