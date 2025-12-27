"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call to send email
        setTimeout(() => {
            setIsLoading(false);
            setIsSent(true);
        }, 1500);
    };

    if (isSent) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="flex justify-center">
                        <div className="bg-green-500/10 p-3 rounded-full">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Kiểm tra email của bạn</h2>
                    <p className="text-muted-foreground">
                        Chúng tôi đã gửi link đặt lại mật khẩu tới <span className="font-semibold text-foreground">{email}</span>.
                        Link sẽ hết hạn trong 15 phút.
                    </p>

                    <div className="pt-4 space-y-4">
                        <Button asChild className="w-full" variant="outline">
                            {/* In a real app, this would be a link in the email. 
                                 For demo purposes, we provide a direct link to proceed. */}
                            <Link href="/reset-password">
                                Mở Link Reset (Demo)
                            </Link>
                        </Button>

                        <Button variant="ghost" className="w-full" asChild>
                            <Link href="/login">
                                Quay lại Đăng nhập
                            </Link>
                        </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mt-4">
                        Không nhận được email? <button className="text-primary hover:underline" onClick={() => setIsSent(false)}>Bấm để gửi lại</button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="bg-primary/10 p-2 rounded-full mb-4">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">
                        Quên mật khẩu?
                    </h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                        Đừng lo, chúng tôi sẽ gửi hướng dẫn khôi phục cho bạn.
                    </p>
                </div>

                <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Địa chỉ Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập email của bạn"
                                className="bg-secondary/50"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Đang gửi link..." : "Đặt lại Mật khẩu"}
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
