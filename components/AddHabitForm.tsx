"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useHabits } from "@/context/HabitContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function AddHabitForm() {
    const { addHabit } = useHabits();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get("action") === "new") {
            setOpen(true);
        }
    }, [searchParams]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen && searchParams.get("action") === "new") {
            // Remove query param when closing
            router.push("/dashboard");
        }
    };
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
    const [timeOfDay, setTimeOfDay] = useState("");

    // Quick color selection
    const colors = [
        { name: "Blue", value: "bg-blue-500" },
        { name: "Green", value: "bg-green-500" },
        { name: "Purple", value: "bg-purple-500" },
        { name: "Orange", value: "bg-orange-500" },
        { name: "Red", value: "bg-red-500" },
        { name: "Pink", value: "bg-pink-500" },
    ];
    const [selectedColor, setSelectedColor] = useState(colors[0].value);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        addHabit({
            title,
            description,
            frequency,
            timeOfDay,
            color: selectedColor,
            icon: "default", // We could add icon picker later
        });

        // Reset and close
        setTitle("");
        setDescription("");
        setFrequency("daily");
        setTimeOfDay("");
        setSelectedColor(colors[0].value);
        handleOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Thêm Thói Quen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tạo Thói Quen Mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Tên Thói Quen</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Đọc sách 30 phút"
                            autoFocus
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Mô tả (Tùy chọn)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ví dụ: Trước khi ngủ"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Tần suất</Label>
                            <div className="flex rounded-md shadow-sm" role="group">
                                {(["daily", "weekly", "monthly"] as const).map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => setFrequency(f)}
                                        className={`px-3 py-1.5 text-xs font-medium border first:rounded-l-md last:rounded-r-md capitalize flex-1 transition-colors ${frequency === f
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                                            }`}
                                    >
                                        {f === "daily" ? "Hàng ngày" : f === "weekly" ? "Hàng tuần" : "Hàng tháng"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">Giờ nhắc (Tùy chọn)</Label>
                            <Input
                                id="time"
                                type="time"
                                value={timeOfDay}
                                onChange={(e) => setTimeOfDay(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Màu sắc</Label>
                        <div className="flex gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    className={`w-8 h-8 rounded-full ${color.value} transition-all ${selectedColor === color.value
                                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                                        : "opacity-70 hover:opacity-100"
                                        }`}
                                    onClick={() => setSelectedColor(color.value)}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit">Tạo Thói Quen</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
