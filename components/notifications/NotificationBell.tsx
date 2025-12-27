"use client";

import { useNotifications } from "@/context/NotificationContext";
import { Bell, Check, Trash2, AlertTriangle, Trophy, Clock, Flame } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"; // Ensure this component exists or is standard in project (we saw imports in task status, but let's assume standard shadcn)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const getIcon = (type: string) => {
        switch (type) {
            case "risk": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case "milestone": return <Trophy className="h-4 w-4 text-yellow-500" />;
            case "achievement": return <Flame className="h-4 w-4 text-orange-500" />;
            case "success": return <Check className="h-4 w-4 text-green-500" />;
            case "reminder": return <Clock className="h-4 w-4 text-blue-500" />;
            default: return <Bell className="h-4 w-4" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold">Thông báo</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-foreground"
                            onClick={markAllAsRead}
                        >
                            Đánh dấu đã đọc
                        </Button>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Chưa có thông báo nào
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                                        !notification.read ? "bg-secondary/30" : ""
                                    )}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="mt-1 shrink-0">
                                        <div className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full border bg-background",
                                            notification.type === 'risk' && "border-orange-500/30 bg-orange-500/10",
                                            notification.type === 'milestone' && "border-yellow-500/30 bg-yellow-500/10",
                                            notification.type === 'achievement' && "border-orange-500/30 bg-orange-500/10",
                                            notification.type === 'success' && "border-green-500/30 bg-green-500/10",
                                            notification.type === 'reminder' && "border-blue-500/30 bg-blue-500/10"
                                        )}>
                                            {getIcon(notification.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", !notification.read && "text-foreground")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground pt-1">
                                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="shrink-0 self-center">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
