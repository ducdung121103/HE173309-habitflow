"use client";

import { useAuth } from "@/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, User as UserIcon, LayoutDashboard, BarChart3 } from "lucide-react";

export function UserMenu() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold leading-none">{user.name}</p>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {user.role || "Customer"}
                            </span>
                        </div>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                        Quản lý Lịch hẹn
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/stats" className="cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4 text-emerald-500" />
                        Báo cáo & Thống kê
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4 text-blue-500" />
                        Hồ sơ tài khoản
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
