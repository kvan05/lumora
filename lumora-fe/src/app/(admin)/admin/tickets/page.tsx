"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { BarcodeImage, ETicketModal } from "@/components/ticket/EventTicket";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Ticket, RefreshCw, Eye, CheckCircle2, XCircle, Clock, History, Barcode, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminTicketsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [checkinFilter, setCheckinFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Timeline State
  const [timelineTicketId, setTimelineTicketId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const res = await api.get("/admin/tickets");
      return res.data.success ? res.data.data : [];
    },
  });

  // Query Ticket Timeline API
  const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ["admin-ticket-timeline", timelineTicketId],
    queryFn: async () => {
      if (!timelineTicketId) return null;
      const res = await api.get(`/admin/tickets/${timelineTicketId}/timeline`);
      return res.data.success ? res.data.data : null;
    },
    enabled: !!timelineTicketId,
  });

  const tickets = Array.isArray(data) ? data : [];

  const filteredTickets = tickets.filter((t: any) => {
    const matchSearch =
      !search ||
      t.ticketCode?.toLowerCase().includes(search.toLowerCase()) ||
      t.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      t.buyerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      t.eventTitle?.toLowerCase().includes(search.toLowerCase()) ||
      t.orderNumber?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || t.orderStatus === statusFilter;
    const matchCheckin =
      checkinFilter === "ALL" ||
      (checkinFilter === "CHECKED_IN" && t.isCheckedIn) ||
      (checkinFilter === "UNCHECKED" && !t.isCheckedIn);

    return matchSearch && matchStatus && matchCheckin;
  });

  const totalTickets = tickets.length;
  const totalConfirmed = tickets.filter((t: any) => ["CONFIRMED", "PAID"].includes(t.orderStatus)).length;
  const totalCheckedIn = tickets.filter((t: any) => t.isCheckedIn).length;
  const totalRefunded = tickets.filter((t: any) => t.orderStatus === "REFUNDED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Ticket className="h-7 w-7 text-primary" /> Quản Lý Vé & Ticket Lifecycle
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và quản lý tất cả mã vé điện tử Barcode, kiểm tra lịch sử vòng đời vé (Lifecycle Timeline) và soát vé.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold gap-2 border-border/60 self-start sm:self-auto"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Real Summary Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Tổng Số Vé Đã Khởi Tạo</p>
            <p className="text-2xl font-black text-foreground mt-1">{totalTickets}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Vé Hợp Lệ (Paid)</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalConfirmed}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-500/20 bg-blue-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Đã Check-in Vào Cổng</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{totalCheckedIn}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-red-500/20 bg-red-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">Vé Đã Hoàn Tiền</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{totalRefunded}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Mã vé Barcode, Email, Tên sự kiện, Mã đơn..."
              className="pl-9 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
              <SelectValue placeholder="Trạng thái đơn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="CONFIRMED">Vé hợp lệ (CONFIRMED)</SelectItem>
              <SelectItem value="PAID">Đã thanh toán (PAID)</SelectItem>
              <SelectItem value="REFUNDED">Hoàn tiền (REFUNDED)</SelectItem>
              <SelectItem value="PENDING">Chờ thanh toán (PENDING)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={checkinFilter} onValueChange={setCheckinFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
              <SelectValue placeholder="Trạng thái Check-in" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="CHECKED_IN">Đã Check-in</SelectItem>
              <SelectItem value="UNCHECKED">Chưa Check-in</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tickets Data Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không tìm thấy vé điện tử nào</p>
              <p className="text-xs mt-1">Dữ liệu vé trong CSDL đang trống hoặc không khớp từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mã Vé Barcode</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Sự Kiện & Người Mua</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Hạng Vé & Giá</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng Thái Đơn</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Check-in</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao Tác Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((t: any) => (
                    <TableRow key={t.id || t.ticketCode} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="font-mono font-bold text-xs bg-muted/40">
                            {t.ticketCode || t.id}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground">Mã đơn: #{t.orderNumber}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-bold text-sm text-foreground truncate max-w-[200px]">{t.eventTitle}</p>
                          <p className="text-xs text-muted-foreground">{t.buyerName} · {t.buyerEmail}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-bold text-xs mb-1 block w-fit">
                          {t.ticketType}
                        </Badge>
                        <p className="text-xs font-extrabold text-foreground">
                          {Number(t.price).toLocaleString("vi-VN")} ₫
                        </p>
                      </TableCell>

                      <TableCell>
                        {t.orderStatus === "CONFIRMED" || t.orderStatus === "PAID" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                            Vé hợp lệ
                          </Badge>
                        ) : t.orderStatus === "REFUNDED" ? (
                          <Badge variant="destructive" className="font-bold">Đã hoàn tiền</Badge>
                        ) : t.orderStatus === "CANCELLED" ? (
                          <Badge variant="outline" className="text-red-500 border-red-500/30">
                            Đã hủy
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Chờ thanh toán</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {t.isCheckedIn ? (
                          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold">
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            <span>Đã Check-in</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Clock className="h-4 w-4" />
                            <span>Chưa Check-in</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl h-8 text-xs font-bold gap-1 border-primary/30 text-primary"
                            onClick={() => setTimelineTicketId(t.id || t.ticketCode)}
                          >
                            <History className="h-3.5 w-3.5" />
                            Timeline Vòng Đời
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl h-8 w-8 p-0"
                            onClick={() =>
                              setSelectedTicket({
                                ticketCode: t.ticketCode,
                                eventTitle: t.eventTitle,
                                bannerUrl: t.bannerUrl,
                                category: t.category,
                                ticketType: t.ticketType,
                                startDate: t.startDate,
                                venue: t.venue,
                                city: t.city,
                                status: t.orderStatus,
                                isCheckedIn: t.isCheckedIn,
                                holderName: t.buyerName,
                              })
                            }
                            title="Xem phôi vé mã vạch"
                          >
                            <Barcode className="h-4 w-4 text-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barcode ETicket Preview Modal */}
      <ETicketModal
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        ticket={selectedTicket}
      />

      {/* Ticket Lifecycle Timeline Modal */}
      <Dialog open={!!timelineTicketId} onOpenChange={(open) => !open && setTimelineTicketId(null)}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Ticket Lifecycle Timeline — Vòng Đời Mã Vé
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lịch sử phát hành mã vạch Barcode, thanh toán PayOS và tiến trình soát vé vào cửa.
            </DialogDescription>
          </DialogHeader>

          {isLoadingTimeline ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : timelineData ? (
            <div className="space-y-4 text-xs pt-2">
              <div className="bg-muted/40 p-3 rounded-2xl border space-y-1">
                <p className="font-bold text-foreground">Sự kiện: {timelineData.ticket.eventTitle}</p>
                <p>Khách hàng: <span className="font-bold text-primary">{timelineData.ticket.buyerName}</span></p>
                <p>Mã vé Barcode: <span className="font-mono font-bold text-foreground">{timelineData.ticket.ticketCode}</span></p>
              </div>

              {/* Timeline Stepper */}
              <div className="relative pl-6 space-y-5 border-l-2 border-primary/30 ml-2 py-1">
                {Array.isArray(timelineData.timeline) &&
                  timelineData.timeline.map((step: any, idx: number) => {
                    const isCancel = step.status === "CANCELLED";
                    const isSuccess = step.status === "SUCCESS";

                    return (
                      <div key={step.id || idx} className="relative">
                        <div
                          className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                            isCancel ? "border-red-500 text-red-500" : isSuccess ? "border-emerald-500 text-emerald-500" : "border-primary text-primary"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${isCancel ? "bg-red-500" : "bg-emerald-500"}`} />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm text-foreground">{step.name}</p>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {new Date(step.timestamp).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
                          <p className="text-[10px] text-primary/80 font-mono mt-1">Actor: {step.actor}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs font-semibold">Không tìm thấy thông tin vòng đời vé.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
