import {
    Appointment,
    ServiceItem,
    StaffItem,
    DashboardStats,
    ConflictCheckRequest,
    ConflictCheckResponse,
    CreateAppointmentRequest
} from "@/types/appointment";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const initialMockServices: ServiceItem[] = [
    { id: 1, name: "Khám tổng quát", description: "Khám và tư vấn sức khỏe tổng thể", durationMinutes: 30, price: 200000, isActive: true },
    { id: 2, name: "Chăm sóc răng miệng", description: "Vệ sinh và kiểm tra răng định kỳ", durationMinutes: 45, price: 350000, isActive: true },
    { id: 3, name: "Tư vấn dinh dưỡng", description: "Lập thực đơn và chế độ ăn uống khoa học", durationMinutes: 60, price: 300000, isActive: true },
    { id: 4, name: "Vật lý trị liệu", description: "Phục hồi chức năng cơ xương khớp", durationMinutes: 45, price: 400000, isActive: true },
];

const initialMockStaff: StaffItem[] = [
    { id: 1, fullName: "Bác sĩ Trần Thị Bình", email: "binh.tran@example.com", role: "Doctor" },
    { id: 2, fullName: "Y tá Hoàng Văn Cường", email: "cuong.hoang@example.com", role: "Nurse" },
    { id: 3, fullName: "Bác sĩ Phạm Thị Dung", email: "dung.pham@example.com", role: "Doctor" },
];

const initialMockAppointments: Appointment[] = [
    {
        id: 1,
        customerId: 1,
        customerName: "Nguyễn Văn An",
        customerEmail: "an.nguyen@example.com",
        customerPhone: "0901234567",
        staffId: 1,
        staffName: "Bác sĩ Trần Thị Bình",
        serviceId: 1,
        serviceName: "Khám tổng quát",
        servicePrice: 200000,
        appointmentDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "09:30",
        status: "Confirmed",
        statusVietnamese: "Đã xác nhận",
        notes: "Khám định kỳ hàng năm",
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        customerId: 2,
        customerName: "Lê Thị Cẩm",
        customerEmail: "cam.le@example.com",
        customerPhone: "0912345678",
        staffId: null,
        staffName: "",
        serviceId: 2,
        serviceName: "Chăm sóc răng miệng",
        servicePrice: 350000,
        appointmentDate: new Date().toISOString().split("T")[0],
        startTime: "10:30",
        endTime: "11:15",
        status: "Pending",
        statusVietnamese: "Chờ duyệt",
        notes: "Lấy cao răng",
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        customerId: 3,
        customerName: "Vũ Đình Đạt",
        customerEmail: "dat.vu@example.com",
        customerPhone: "0923456789",
        staffId: 1,
        staffName: "Bác sĩ Trần Thị Bình",
        serviceId: 3,
        serviceName: "Tư vấn dinh dưỡng",
        servicePrice: 300000,
        appointmentDate: new Date().toISOString().split("T")[0],
        startTime: "14:00",
        endTime: "15:00",
        status: "Completed",
        statusVietnamese: "Hoàn thành",
        notes: "Tư vấn giảm cân",
        createdAt: new Date().toISOString()
    }
];

// Helper to do safe fetch with JSON response
async function fetchJson<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers || {})
            },
            // Fast timeout for SSR/offline detection
            signal: AbortSignal.timeout(4000)
        });

        if (!res.ok) {
            const errBody = (await res.json().catch(() => ({}))) as { message?: string };
            throw new Error(errBody.message || `Lỗi HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err: unknown) {
        if (fallback !== undefined) {
            return fallback;
        }
        throw err;
    }
}

export const api = {
    async getAppointments(status?: string): Promise<Appointment[]> {
        const query = status ? `?status=${encodeURIComponent(status)}` : "";
        return fetchJson<Appointment[]>(
            `${API_BASE}/appointments${query}`,
            undefined,
            status ? initialMockAppointments.filter(a => a.status.toLowerCase() === status.toLowerCase()) : initialMockAppointments
        );
    },

    async getAppointmentById(id: number): Promise<Appointment | null> {
        return fetchJson<Appointment | null>(
            `${API_BASE}/appointments/${id}`,
            undefined,
            initialMockAppointments.find(a => a.id === id) || null
        );
    },

    async createAppointment(dto: CreateAppointmentRequest): Promise<Appointment> {
        return fetchJson<Appointment>(
            `${API_BASE}/appointments`,
            {
                method: "POST",
                body: JSON.stringify(dto)
            }
        );
    },

    async updateStatus(id: number, status: string, staffId?: number, reason?: string): Promise<Appointment> {
        return fetchJson<Appointment>(
            `${API_BASE}/appointments/${id}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({ id, status, staffId, reason })
            }
        );
    },

    async checkConflict(req: ConflictCheckRequest): Promise<ConflictCheckResponse> {
        return fetchJson<ConflictCheckResponse>(
            `${API_BASE}/appointments/check-conflict`,
            {
                method: "POST",
                body: JSON.stringify(req)
            },
            {
                hasConflict: false,
                message: "Khung giờ này khả dụng (Offline mode).",
                conflictingSlots: []
            }
        );
    },

    async getDashboardStats(): Promise<DashboardStats> {
        return fetchJson<DashboardStats>(
            `${API_BASE}/appointments/stats`,
            undefined,
            {
                totalAppointments: initialMockAppointments.length,
                pendingCount: initialMockAppointments.filter(a => a.status === "Pending").length,
                confirmedCount: initialMockAppointments.filter(a => a.status === "Confirmed").length,
                completedCount: initialMockAppointments.filter(a => a.status === "Completed").length,
                cancelledCount: 0,
                upcomingTodayCount: 2,
                todayCount: 2,
                totalRevenue: 850000
            }
        );
    },

    async getServices(): Promise<ServiceItem[]> {
        return fetchJson<ServiceItem[]>(
            `${API_BASE}/services`,
            undefined,
            initialMockServices
        );
    },

    async getStaffList(): Promise<StaffItem[]> {
        return fetchJson<StaffItem[]>(
            `${API_BASE}/staff`,
            undefined,
            initialMockStaff
        );
    },

    async getNotifications(): Promise<Record<string, unknown>[]> {
        return fetchJson<Record<string, unknown>[]>(
            `${API_BASE}/notifications/recent`,
            undefined,
            [
                { id: 1, message: "Lịch hẹn #1 đã được xác nhận bởi Bác sĩ Bình.", type: "StatusChanged", isRead: false, sentAt: new Date().toISOString() },
                { id: 2, message: "Nhắc nhở: Bạn có lịch hẹn khám lúc 10:30 hôm nay.", type: "Reminder", isRead: false, sentAt: new Date().toISOString() },
            ]
        );
    },

    async markNotificationRead(id: number): Promise<boolean> {
        return fetchJson<boolean>(
            `${API_BASE}/notifications/${id}/read`,
            { method: "PUT" },
            true
        );
    }
};
