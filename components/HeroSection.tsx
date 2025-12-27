"use client";

import Link from "next/link";
import { Flame, CheckCircle2, TrendingUp, Target, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function HeroSection() {
    return (
        <div className="flex flex-col items-center justify-center space-y-20 py-24 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Hero Content */}
            <div className="text-center space-y-6 max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    Xây Dựng Thói Quen Tốt,<br />
                    <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
                        Mỗi Ngày Một Chút
                    </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Theo dõi lịch trình hàng ngày, xây dựng chuỗi thói quen mạnh mẽ và giữ kỷ luật
                    với biểu đồ tiến độ trực quan. Biến mục tiêu thành thói quen bền vững.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        Bắt Đầu Miễn Phí
                    </Link>

                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background/50 px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring gap-2">
                                <BookOpen className="h-4 w-4" /> Hướng Dẫn Sử Dụng
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Chào mừng đến với HabitFlow</DialogTitle>
                                <DialogDescription>
                                    Người bạn đồng hành xây dựng thói quen của bạn.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                    <h3 className="font-semibold text-primary mb-1">Tác giả</h3>
                                    <p className="text-lg font-bold">Bùi Đức Dũng</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Giới thiệu</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            HabitFlow là ứng dụng theo dõi thói quen hiện đại, giao diện tối (dark theme), giúp bạn xây dựng sự kiên trì.
                                            Với chuỗi (streak) trực quan và theo dõi thời gian thực, việc bám sát mục tiêu trở nên dễ dàng hơn bao giờ hết.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-lg mb-2">Cách sử dụng</h3>
                                        <ul className="space-y-3 text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <span className="bg-secondary text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                                                <span><strong>Đăng nhập:</strong> Truy cập dashboard để bắt đầu theo dõi.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="bg-secondary text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                                                <span><strong>Tạo thói quen:</strong> Bấm "Thêm thói quen", chọn tiêu đề, tần suất (Hàng ngày/Hàng tuần/Hàng tháng), và giờ (tùy chọn).</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="bg-secondary text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                                                <span><strong>Theo dõi tiến độ:</strong> Check-in hàng ngày để xây dựng chuỗi. Xem đồng hồ đếm ngược cho phiên tiếp theo của bạn!</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <FeatureCard
                    icon={<Flame className="h-6 w-6 text-blue-500" />}
                    title="Chuỗi Bất Bại"
                    description="Trực quan hóa sự kiên trì. Giữ lửa chuỗi và duy trì động lực khi nhìn thấy lịch sử phát triển của bạn."
                    href="/dashboard"
                />
                <FeatureCard
                    icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
                    title="Điểm Danh Hàng Ngày"
                    description="Ghi nhận thành quả mỗi ngày chỉ trong vài giây. Đánh dấu hoàn thành và tự nhìn lại tiến độ."
                    href="/dashboard"
                />
                <FeatureCard
                    icon={<TrendingUp className="h-6 w-6 text-yellow-500" />}
                    title="Thống Kê Tiến Độ"
                    description="Trực quan hóa hành trình của bạn với các chỉ số chi tiết và tỷ lệ hoàn thành."
                    href="/dashboard/stats"
                />
                <FeatureCard
                    icon={<Target className="h-6 w-6 text-purple-500" />}
                    title="Mục Tiêu Tùy Chỉnh"
                    description="Đặt thói quen hàng ngày hoặc hàng tuần phù hợp với mục tiêu sức khỏe cá nhân của bạn."
                    href="/dashboard?action=new"
                />
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
    return (
        <Link href={href} className="block text-left group">
            <div className="h-full rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-start space-y-4 transition-all duration-300 hover:border-primary/50 hover:bg-secondary/20 hover:scale-[1.02] hover:shadow-md cursor-pointer">
                <div className="p-3 rounded-lg bg-secondary/50 group-hover:bg-primary/20 transition-colors">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}
