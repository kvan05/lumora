"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  CheckCheck,
  Ticket,
  Wallet,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch recent notifications (top 5 for popover)
  const { data, isLoading } = useQuery({
    queryKey: ["notifications-preview"],
    queryFn: async () => {
      const res = await api.get("/notifications?limit=5");
      return res.data.data;
    },
    enabled: !!session,
    staleTime: 30000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Mark all read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/all/read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    },
  });

  // Mark single item read mutation
  const markSingleRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {}
  };

  // Real-time socket listener
  useEffect(() => {
    if (!session) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";
    const token = (session as any)?.accessToken;

    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socket.on("notification:new", (newNotif: any) => {
      toast.info(newNotif.title || "Thông báo mới", {
        description: newNotif.message,
      });

      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [session, queryClient]);

  const handleItemClick = (item: any) => {
    setIsOpen(false);
    if (!item.isRead) {
      markSingleRead(item.id);
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
      } catch (e) {}
    }

    router.push("/notifications");
  };

  const getIcon = (type: string) => {
    if (type.includes("ORDER") || type.includes("TICKET")) {
      return <Ticket className="h-4 w-4 text-[#EB5B95]" />;
    }
    if (type.includes("WITHDRAWAL") || type.includes("FINANCE")) {
      return <Wallet className="h-4 w-4 text-emerald-500" />;
    }
    if (type.includes("EVENT")) {
      return <Calendar className="h-4 w-4 text-[#93C453]" />;
    }
    return <ShieldCheck className="h-4 w-4 text-sky-500" />;
  };

  if (!session) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EB5B95] px-1 text-[11px] font-extrabold text-white shadow-md animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-0 bg-white dark:bg-slate-900 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Thông báo</h4>
            {unreadCount > 0 && (
              <Badge className="bg-[#EB5B95]/15 text-[#EB5B95] border-none text-[10px] px-2 font-bold">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className="h-7 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 gap-1 px-2 font-semibold"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Đánh dấu đã đọc
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Bell className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Không có thông báo mới nào</p>
            </div>
          ) : (
            notifications.map((item: any) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 focus:bg-slate-100/80 dark:focus:bg-slate-800/80 ${
                  !item.isRead ? "bg-slate-50/90 dark:bg-slate-800/40" : ""
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs leading-snug truncate ${!item.isRead ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                      {item.title}
                    </p>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#EB5B95] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pt-0.5">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {/* Footer */}
        <DropdownMenuSeparator className="m-0" />
        <Link
          href="/notifications"
          onClick={() => setIsOpen(false)}
          className="flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-[#4A7C59] dark:text-[#93C453] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          Xem tất cả thông báo <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
