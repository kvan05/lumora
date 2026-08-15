"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import staffApi from "@/lib/staff-api";
import { clearStaffSession, getStaffUser } from "@/lib/staff-auth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import {
  Calendar, MapPin, Ticket, ScanLine, ChevronRight,
  LogOut, User, Clock, CheckCircle2, Loader2, List,
  AlertCircle, RefreshCw
} from "lucide-react";

interface EventStat {
  assignmentId: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
    venue: string;
    address: string;
    city: string;
    bannerUrl: string | null;
  };
  stats: {
    totalTickets: number;
    checkedIn: number;
    remaining: number;
    percentage: number;
  };
}

export default function StaffEventsPage() {
  const router = useRouter();
  const staffUser = getStaffUser();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["staff-my-events"],
    queryFn: async () => {
      const res = await staffApi.get("/staff/events");
      return res.data.data as EventStat[];
    },
    retry: 1,
  });

  const handleLogout = () => {
    clearStaffSession();
    toast.success("Đã đăng xuất");
    router.replace("/staff/login");
  };

  const events = data || [];

  const statusLabel: Record<string, { label: string; cls: string }> = {
    APPROVED: { label: "Đã duyệt", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    PUBLISHED: { label: "Đang diễn ra", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    DRAFT: { label: "Nháp", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
    ENDED: { label: "Kết thúc", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    CANCELLED: { label: "Đã hủy", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  };

  return (
    <div className="min-h-screen bg-[#060610] pb-safe">
      {/* Fixed Header */}
      <div className="sticky top-0 z-20 bg-[#060610]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-md">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Lumora Staff</p>
              <p className="text-zinc-500 text-[11px] mt-0.5 truncate max-w-[180px]">
                {staffUser?.name || staffUser?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <button
              id="staff-logout-btn"
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-bold text-white">
            Sự kiện của bạn
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Chọn sự kiện để bắt đầu soát vé
          </p>
        </div>

        {/* Events */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            <p className="text-zinc-500 text-sm">Đang tải...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center">
              <Calendar className="w-8 h-8 text-zinc-600" />
            </div>
            <div>
              <p className="text-zinc-400 font-medium">Chưa có sự kiện nào</p>
              <p className="text-zinc-600 text-sm mt-1">
                Seller chưa gán sự kiện nào cho bạn
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((item) => {
              const s = statusLabel[item.event.status] ?? { label: item.event.status, cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" };
              const pct = item.stats.percentage;

              return (
                <div
                  key={item.assignmentId}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-200 active:scale-[0.99]"
                >
                  {/* Banner */}
                  {item.event.bannerUrl ? (
                    <div className="h-28 overflow-hidden">
                      <img
                        src={item.event.bannerUrl}
                        alt={item.event.title}
                        className="w-full h-full object-cover opacity-70"
                      />
                    </div>
                  ) : (
                    <div className="h-14 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40" />
                  )}

                  <div className="p-4 space-y-4">
                    {/* Title + status */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-base leading-tight line-clamp-2">
                          {item.event.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(item.event.startDate), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.event.venue}, {item.event.city}
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Check-in Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Check-in: <span className="text-white font-semibold ml-1">{item.stats.checkedIn}</span>/{item.stats.totalTickets}
                        </span>
                        <span className="font-bold text-white">{pct}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500">
                        Còn lại: <span className="text-amber-400 font-medium">{item.stats.remaining}</span> vé chưa check-in
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        id={`scan-btn-${item.event.id}`}
                        onClick={() => router.push(`/staff/events/${item.event.id}/scan`)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-violet-500/20"
                      >
                        <ScanLine className="w-4 h-4" />
                        Quét mã
                      </button>
                      <button
                        id={`list-btn-${item.event.id}`}
                        onClick={() => router.push(`/staff/events/${item.event.id}/tickets`)}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
                      >
                        <List className="w-4 h-4" />
                        Danh sách
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
