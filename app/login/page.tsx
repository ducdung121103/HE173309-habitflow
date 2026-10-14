"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/user";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("an.nguyen@example.com");
    const [password, setPassword] = useState("Password123!");
    const [role, setRole] = useState<UserRole>("Customer");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await login(email, password, role);
            router.push("/dashboard");
        } catch (err: unknown) {
            const errorObj = err as Error;
            setError(errorObj.message || "Đã xảy ra lỗi khi đăng nhập.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickLogin = (demoEmail: string, demoRole: UserRole) => {
        setEmail(demoEmail);
        setRole(demoRole);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="bg-primary/10 text-primary p-3 rounded-2xl mb-4 border border-primary/20">
                        <Calendar className="h-8 w-8" />
                    </div>
                    <h2 className="text-center text-3xl font-extrabold tracking-tight">
                        Đăng Nhập AppointmentSystem
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Hệ thống Đặt &amp; Quản trị Lịch hẹn Y tế Trực tuyến
                    </p>
                </div>

                <div className="mt-6 space-y-6">
                    {/* Demo Quick Fill */}
                    <div className="p-3.5 rounded-xl border bg-secondary/30 space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-primary" /> Chọn nhanh tài khoản Demo:
                        </span>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin("an.nguyen@example.com", "Customer")}
                                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                                    email === "an.nguyen@example.com"
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background hover:bg-muted"
                                }`}
                            >
                                👤 Khách hàng (An)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin("binh.tran@example.com", "Staff")}
                                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                                    email === "binh.tran@example.com"
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background hover:bg-muted"
                                }`}
                            >
                                🩺 Bác sĩ (Bình)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickLogin("admin@example.com", "Admin")}
                                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                                    email === "admin@example.com"
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background hover:bg-muted"
                                }`}
                            >
                                🛡️ Quản trị viên
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Địa chỉ Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="bg-secondary/50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Mật khẩu</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Quên mật khẩu?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="bg-secondary/50"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-rose-500 font-medium text-center">{error}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    "Đang xác thực..."
                                ) : (
                                    <>
                                        Vào hệ thống <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Bạn chưa có tài khoản?{" "}
                        <Link
                            href="/signup"
                            className="font-medium text-primary hover:underline"
                        >
                            Đăng ký tài khoản mới
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
