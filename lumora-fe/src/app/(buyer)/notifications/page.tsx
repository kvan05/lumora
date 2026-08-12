"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCheck,
  Ticket,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Clock,
} from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [page, setPage] = useState<number>(1);

  // Fetch Notifications
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: async () => {
      const res = await api.get(`/notifications?page=${page}&limit=20`);
      return res.data.data;
    },
    enabled: !!session,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/all/read");
    },
    onSuccess: () => {
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      toast.success("Đã xóa thông báo.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
    },
  });

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }

    if (item.metadata) {
      try {
        const meta = typeof item.metadata === "string" ? JSON.parse(item.metadata) : item.metadata;
        if (meta.orderId) {
          router.push(`/orders/${meta.orderId}`);
          return;
        }
        if (meta.withdrawalId) {
          const userRole = (session?.user as any)?.role;
          if (userRole === "ADMIN") {
            router.push("/admin/reconciliation");
          } else {
            router.push("/seller/finance");
          }
          return;
        }
        if (meta.eventId) {
          const userRole = (session?.user as any)?.role;
          if (userRole === "SELLER") {
            router.push(`/seller/events/${meta.eventId}`);
          } else if (userRole === "ADMIN") {
            router.push("/admin/events");
          } else {
            router.push(`/events/${meta.eventId}`);
          }
          return;
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  };

  // Helper to render type-specific icons
  const getNotificationIcon = (type: string) => {
    if (type.includes("WITHDRAWAL") || type.includes("FINANCE")) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Ticket className="h-5 w-5" />
        </div>
      );
    }
    switch (type) {
      case "ORDER_CONFIRMED":
      case "TICKET_ISSUED":
      case "SELLER_NEW_ORDER":
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Ticket className="h-5 w-5" />
          </div>
        );
      case "PAYMENT_SUCCESS":
      case "SEAT_RESERVED":
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
        );
      case "EVENT_CANCELLED":
      case "REFUND_APPROVED":
        return (
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#93C453]/20 text-[#4A7C59] dark:text-[#93C453] flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
        );
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Bell className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold">Vui lòng đăng nhập</h2>
          <p className="text-sm text-muted-foreground">
            Bạn cần đăng nhập để xem danh sách thông báo và cập nhật mới nhất.
          </p>
          <Button asChild className="rounded-full bg-[#93C453] text-slate-900 font-bold px-6">
            <Link href="/login?callbackUrl=/notifications">Đăng nhập ngay</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((item: any) => {
    if (activeTab === "unread") return !item.isRead;
    if (activeTab === "orders") return ["ORDER_CONFIRMED", "SEAT_RESERVED", "PAYMENT_SUCCESS", "TICKET_ISSUED"].includes(item.type);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="h-7 w-7 text-[#EB5B95]" />
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
                Thông báo của tôi
              </h1>
              {unreadCount > 0 && (
                <Badge className="bg-[#EB5B95] text-white font-extrabold rounded-full px-2.5 py-0.5 text-xs">
                  {unreadCount} mới
                </Badge>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Cập nhật vé, xác nhận thanh toán và thông tin sự kiện của bạn.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="rounded-full border-[#93C453] text-[#4A7C59] dark:text-[#93C453] hover:bg-[#93C453] hover:text-slate-900 font-bold text-xs shrink-0 gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        {/* Tabs Filter */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800 h-12 grid grid-cols-3 w-full sm:w-[400px]">
            <TabsTrigger value="all" className="rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-[#93C453] data-[state=active]:text-slate-900">
              Tất cả ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-[#93C453] data-[state=active]:text-slate-900">
              Chưa đọc ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl font-bold text-xs sm:text-sm data-[state=active]:bg-[#93C453] data-[state=active]:text-slate-900">
              Đơn hàng & Vé
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-3xl" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <Bell className="h-12 w-12 mx-auto text-slate-400" />
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Không có thông báo nào</h3>
            <p className="text-xs text-slate-500">
              {activeTab === "unread"
                ? "Bạn đã đọc hết tất cả thông báo!"
                : "Danh sách thông báo của bạn sẽ xuất hiện ở đây khi có cập nhật mới."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item: any) => {
              const isUnread = !item.isRead;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex gap-4 items-start ${
                    isUnread
                      ? "bg-white dark:bg-slate-900 border-[#93C453]/60 shadow-md"
                      : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-90 hover:opacity-100"
                  }`}
                >
                  {/* Icon */}
                  {getNotificationIcon(item.type)}

                  {/* Body Content */}
                  <div className="flex-1 space-y-1 pr-6">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-base font-extrabold leading-snug ${isUnread ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EB5B95] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</span>
                    </div>
                  </div>

                  {/* Chevron Right Action */}
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-[#93C453] group-hover:translate-x-1 transition-all self-center" />
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
