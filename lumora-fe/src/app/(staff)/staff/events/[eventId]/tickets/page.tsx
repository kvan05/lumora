"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import staffApi from "@/lib/staff-api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft, Search, CheckCircle2, Clock, User, Ticket,
  MapPin, Loader2, ScanLine, X, Filter
} from "lucide-react";

type StatusFilter = "ALL" | "CHECKED_IN" | "NOT_CHECKED_IN";

export default function StaffTicketListPage() {
  const router = useRouter();
  const { eventId } = useParams<{ eventId: string }>();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  // Event detail
  const { data: eventData } = useQuery({
    queryKey: ["staff-event-detail", eventId],
    queryFn: async () => {
      const res = await staffApi.get(`/staff/events/${eventId}`);
      return res.data.data;
    },
  });

  // Ticket list
  const { data: ticketData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["staff-tickets", eventId, search, statusFilter, page],
    queryFn: async () => {
      const res = await staffApi.get(`/staff/events/${eventId}/tickets`, {
        params: {
          search: search || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          page,
          limit: 30,
        },
      });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });

  const eventInfo = eventData?.event;
  const stats = eventData?.stats;
  const tickets = ticketData?.tickets || [];
  const pagination = ticketData?.pagination;

  return (
    <div className="min-h-screen bg-[#060610] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#060610]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{eventInfo?.title || "Danh sách vé"}</p>
            {stats && (
              <p className="text-xs text-zinc-500 mt-0.5">
                <span className="text-emerald-400 font-medium">{stats.checkedIn}</span>/{stats.totalTickets} đã check-in
              </p>
            )}
          </div>
          <button
            onClick={() => router.push(`/staff/events/${eventId}/scan`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold"
          >
            <ScanLine className="w-3.5 h-3.5" /> Quét
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-4 space-y-4">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Tổng vé", value: stats.totalTickets, cls: "text-white" },
              { label: "Đã vào", value: stats.checkedIn, cls: "text-emerald-400" },
              { label: "Chưa vào", value: stats.remaining, cls: "text-amber-400" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.04] border border-white/10 rounded-xl p-3 text-center">
                <p className={`text-xl font-black ${s.cls}`}>{s.value}</p>
                <p className="text-zinc-500 text-[11px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã vé, tên, email..."
            className="w-full pl-10 pr-10 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 p-1 bg-white/[0.04] rounded-xl border border-white/10">
          {(["ALL", "CHECKED_IN", "NOT_CHECKED_IN"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === f
                  ? f === "CHECKED_IN"
                    ? "bg-emerald-600 text-white"
                    : f === "NOT_CHECKED_IN"
                    ? "bg-amber-600 text-white"
                    : "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f === "ALL" ? "Tất cả" : f === "CHECKED_IN" ? "✓ Đã vào" : "⏳ Chưa vào"}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Ticket className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-zinc-500 text-sm">Không tìm thấy vé nào</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {isFetching && (
              <div className="flex justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              </div>
            )}
            {tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                  ticket.isCheckedIn
                    ? "bg-emerald-500/[0.06] border-emerald-500/20"
                    : "bg-white/[0.03] border-white/[0.07]"
                }`}
              >
                {/* Status indicator */}
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ticket.isCheckedIn ? "bg-emerald-500/20" : "bg-amber-500/10"
                }`}>
                  {ticket.isCheckedIn
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <Clock className="w-4 h-4 text-amber-400" />
                  }
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {/* Buyer name */}
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-zinc-500 shrink-0" />
                    <p className="text-white text-sm font-medium truncate">
                      {ticket.buyer?.name || ticket.buyer?.email || "—"}
                    </p>
                  </div>

                  {/* Ticket type */}
                  {ticket.ticketType && (
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3 h-3 text-zinc-500 shrink-0" />
                      <p className="text-zinc-400 text-xs truncate">{ticket.ticketType.name}</p>
                    </div>
                  )}

                  {/* Seat */}
                  {ticket.seat && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                      <p className="text-zinc-400 text-xs">Ghế {ticket.seat.seatLabel}</p>
                    </div>
                  )}

                  {/* Ticket code */}
                  <p className="text-zinc-600 text-[10px] font-mono truncate">
                    {ticket.ticketCode || ticket.id}
                  </p>
                </div>

                {/* Right side */}
                <div className="shrink-0 text-right">
                  {ticket.isCheckedIn ? (
                    <div className="space-y-0.5">
                      <p className="text-emerald-400 text-[10px] font-bold">ĐÃ VÀO</p>
                      {ticket.checkedInAt && (
                        <p className="text-zinc-600 text-[10px]">
                          {format(new Date(ticket.checkedInAt), "HH:mm", { locale: vi })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-amber-400 text-[10px] font-bold">CHƯA VÀO</p>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-zinc-300 text-sm disabled:opacity-40"
                >
                  ← Trước
                </button>
                <span className="text-zinc-500 text-sm">
                  {page}/{pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-zinc-300 text-sm disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
