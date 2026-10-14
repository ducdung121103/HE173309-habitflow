"use client";

import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { useSignalR } from "@/context/SignalRContext";
import { UserMenu } from "@/components/UserMenu";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Button } from "@/components/ui/button";

export function Navbar() {
    const { status: signalRStatus } = useSignalR();

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center space-x-2.5">
                        <div className="bg-primary/10 text-primary p-1.5 rounded-lg border border-primary/20">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <span className="font-extrabold sm:inline-block text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-primary to-indigo-600">
                            AppointmentSystem
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
                        <Link href="/dashboard" className="transition-colors hover:text-foreground">
                            Lịch hẹn
                        </Link>
                        <Link href="/dashboard/stats" className="transition-colors hover:text-foreground">
                            Thống kê
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* SignalR indicator */}
                    <div
                        className="hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-card"
                        title={
                            signalRStatus === "connected"
                                ? "Kênh SignalR thời gian thực đang hoạt động"
                                : signalRStatus === "reconnecting"
                                ? "Đang kết nối lại SignalR..."
                                : "Ngoại tuyến"
                        }
                    >
                        {signalRStatus === "connected" ? (
                            <>
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-emerald-500 font-medium">Real-time</span>
                            </>
                        ) : signalRStatus === "reconnecting" ? (
                            <>
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-amber-500 font-medium">Kết nối lại</span>
                            </>
                        ) : (
                            <>
                                <span className="h-2 w-2 rounded-full bg-zinc-400" />
                                <span className="text-zinc-400">Offline</span>
                            </>
                        )}
                    </div>

                    <BookAppointmentDialog
                        triggerButton={
                            <Button size="sm" className="hidden sm:inline-flex h-8 gap-1.5 text-xs font-semibold">
                                <Plus className="h-3.5 w-3.5" /> Đặt lịch
                            </Button>
                        }
                    />

                    <NotificationBell />
                    <AuthButtons />
                </div>
            </div>
        </nav>
    );
}

function AuthButtons() {
    const { user, loading } = useAuth();

    if (loading) return <div className="h-8 w-20 bg-muted/20 animate-pulse rounded-md" />;

    if (user) {
        return <UserMenu />;
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href="/login"
                className="text-xs font-medium transition-colors hover:text-foreground/80 text-foreground/60 px-3 py-1.5"
            >
                Đăng nhập
            </Link>
            <Link
                href="/signup"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
                Đăng ký
            </Link>
        </div>
    );
}
