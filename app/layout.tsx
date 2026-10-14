import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { HabitProvider } from "@/context/HabitContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SignalRProvider } from "@/context/SignalRContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppointmentSystem - Quản Lý & Đặt Lịch Hẹn Trực Tuyến",
  description: "Hệ thống đặt lịch khám và quản lý lịch hẹn trực tuyến chuyên nghiệp kết hợp SignalR thời gian thực",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SignalRProvider>
            <HabitProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </HabitProvider>
          </SignalRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
