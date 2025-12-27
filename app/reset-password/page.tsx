"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Mật khẩu phải có ít ít nhất 8 ký tự");
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu không khớp");
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);

            // Auto redirect after 3s
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="flex justify-center">
                        <div className="bg-green-500/10 p-3 rounded-full">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Đặt lại mật khẩu</h2>
                    <p className="text-muted-foreground">
                        Mật khẩu của bạn đã được đặt lại thành công.
                        Đang chuyển hướng về trang đăng nhập...
                    </p>
                    <Button asChild className="w-full mt-4">
                        <Link href="/login">Về trang Đăng nhập</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="bg-primary/10 p-2 rounded-full mb-4">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">
                        Đặt mật khẩu mới
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Phải có ít nhất 8 ký tự.
                    </p>
                </div>

                <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu mới</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-secondary/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-secondary/50"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                        </Button>
                    </form>

                    <div className="mt-6 flex justify-center">
                        <Link
                            href="/login"
                            className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
