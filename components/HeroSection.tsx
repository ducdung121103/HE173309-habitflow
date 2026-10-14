"use client";

import Link from "next/link";
import {
    Calendar,
    ShieldCheck,
    Zap,
    Cpu,
    BellRing,
    Sparkles,
    ArrowRight,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";

export function HeroSection() {
    return (
        <div className="flex flex-col items-center justify-center space-y-16 py-16 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Hero Main Content */}
            <div className="text-center space-y-6 max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5" /> Kiến trúc Clean Architecture & SignalR Real-time
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                    Hệ Thống Quản Lý &<br />
                    <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">
                        Đặt Lịch Hẹn Thông Minh
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Giải pháp quản lý lịch hẹn y tế và chăm sóc sức khỏe chuẩn công nghiệp. Kiểm tra xung đột thời gian tức thì, đồng bộ real-time đa nền tảng (Web, Desktop TCP Socket, Worker Service).
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
                    <BookAppointmentDialog
                        triggerButton={
                            <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Calendar className="h-5 w-5" /> Đặt lịch hẹn ngay
                            </Button>
                        }
                    />

                    <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold gap-2" asChild>
                        <Link href="/dashboard">
                            Truy cập Dashboard <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm hover:border-primary/40 hover:bg-secondary/20 transition-all duration-300">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 w-fit mb-4">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">SignalR Real-time</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Cơ chế kết nối tự động reconnect, broadcast sự kiện tức thì khi có lịch hẹn mới, hủy lịch hoặc cập nhật trạng thái.
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm hover:border-emerald-500/40 hover:bg-secondary/20 transition-all duration-300">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit mb-4">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Chống Xung Đột Lịch</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Thuật toán so sánh khoảng thời gian `(StartA &lt; EndB) &amp;&amp; (EndA &gt; StartB)` ngăn chặn 100% tình trạng đặt trùng giờ.
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm hover:border-purple-500/40 hover:bg-secondary/20 transition-all duration-300">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 w-fit mb-4">
                        <Cpu className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">TCP Socket Server</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Máy chủ TCP Port 5050 phục vụ Desktop App độc lập. Áp dụng `IServiceScopeFactory` an toàn concurrency đa luồng.
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm hover:border-amber-500/40 hover:bg-secondary/20 transition-all duration-300">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 w-fit mb-4">
                        <BellRing className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Worker Service</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        Dịch vụ nền .NET `BackgroundService` định kỳ quét lịch sắp tới, tự động gửi nhắc nhở và kích hoạt SignalR bridge.
                    </p>
                </div>
            </div>

            {/* Quick Overview Section */}
            <div className="w-full rounded-2xl border bg-card/40 p-8">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                    <h2 className="text-2xl font-bold">Dịch vụ Y tế & Chăm sóc Tiêu biểu</h2>
                    <p className="text-muted-foreground text-sm">
                        Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm và trang thiết bị hiện đại sẵn sàng phục vụ.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
                        <div className="p-4 rounded-xl border bg-background/60 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm">Khám tổng quát</h4>
                                <p className="text-xs text-muted-foreground">Khám sàng lọc và tư vấn sức khỏe tổng thể định kỳ.</p>
                                <span className="text-xs font-bold text-primary mt-1 inline-block">200.000 VNĐ • 30 phút</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border bg-background/60 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm">Chăm sóc răng miệng</h4>
                                <p className="text-xs text-muted-foreground">Lấy cao răng, kiểm tra và chăm sóc nụ cười rạng rỡ.</p>
                                <span className="text-xs font-bold text-primary mt-1 inline-block">350.000 VNĐ • 45 phút</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border bg-background/60 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm">Tư vấn dinh dưỡng</h4>
                                <p className="text-xs text-muted-foreground">Lập thực đơn khoa học phù hợp từng thể trạng cá nhân.</p>
                                <span className="text-xs font-bold text-primary mt-1 inline-block">300.000 VNĐ • 60 phút</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border bg-background/60 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-sm">Vật lý trị liệu</h4>
                                <p className="text-xs text-muted-foreground">Phục hồi chức năng cơ xương khớp và giảm đau hiệu quả.</p>
                                <span className="text-xs font-bold text-primary mt-1 inline-block">400.000 VNĐ • 45 phút</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
