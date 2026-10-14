"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
    const router = useRouter();
    const { signup } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            setIsLoading(false);
            return;
        }

        try {
            await signup(name, email, phone);
            router.push("/dashboard?welcome=true");
        } catch (err: unknown) {
            const errorObj = err as Error;
            setError(errorObj.message || "Đăng ký thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="bg-primary/10 text-primary p-3 rounded-2xl mb-4 border border-primary/20">
                        <Calendar className="h-8 w-8" />
                    </div>
                    <h2 className="text-center text-3xl font-extrabold tracking-tight">
                        Tạo Tài Khoản Khách Hàng
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Đăng ký để quản lý và theo dõi lịch khám trực tuyến
                    </p>
                </div>

                <div className="mt-6 space-y-6">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Họ và Tên</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    className="bg-secondary/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email">Địa chỉ Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="a.nguyen@example.com"
                                    className="bg-secondary/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone">Số điện thoại</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0901234567"
                                    className="bg-secondary/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Mật khẩu</Label>
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

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">Xác nhận Mật khẩu</Label>
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
                                <p className="text-xs text-rose-500 font-medium text-center">{error}</p>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    "Đang tạo tài khoản..."
                                ) : (
                                    <>
                                        Đăng ký ngay <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Đã có tài khoản?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-primary hover:underline"
                        >
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
