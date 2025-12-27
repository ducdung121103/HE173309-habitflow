import Link from "next/link";
import { Flame } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8">
                <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <div className="bg-primary/10 p-1 rounded-full">
                            <Flame className="h-6 w-6 text-primary" fill="currentColor" />
                        </div>
                        <span className="hidden font-bold sm:inline-block text-lg tracking-tight">
                            HabitFlow
                        </span>
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <NotificationBell />
                    <Link
                        href="/login"
                        className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Đăng nhập
                    </Link>
                    <Link
                        href="/signup"
                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        Đăng ký
                    </Link>
                </div>
            </div>
        </nav>
    );
}
