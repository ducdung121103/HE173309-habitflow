"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await login(email); // Passwords are not checked in this demo, just email lookup
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi khi đăng nhập.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="bg-primary/10 p-2 rounded-full mb-4">
                        <Flame className="h-8 w-8 text-primary" fill="currentColor" />
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">
                        Chào mừng trở lại
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Đăng nhập để tiếp tục hành trình xây dựng thói quen của bạn
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="email">Địa chỉ Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="hello@example.com"
                                    className="bg-secondary/50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Mật khẩu</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-medium text-primary hover:text-primary/80"
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
                                <p className="text-sm text-red-500 text-center">{error}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    "Đang đăng nhập..."
                                ) : (
                                    <>
                                        Đăng nhập <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-card px-2 text-muted-foreground">
                                        Hoặc tiếp tục với
                                    </span>
                                </div>
                            </div>

                            <SocialAuthButtons />
                        </div>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        Bạn chưa có tài khoản?{" "}
                        <Link
                            href="/signup"
                            className="font-medium text-primary hover:text-primary/80"
                        >
                            Đăng ký
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
