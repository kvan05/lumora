"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  QrCode, Search, CheckCircle2, XCircle, Clock, ShieldCheck, Eye, Ticket as TicketIcon, Scan, RefreshCw, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { QRCodeImage, ETicketModal } from "@/components/ticket/EventTicket";

export default function AdminCheckinPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [modalTicket, setModalTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CHECKED_IN" | "NOT_CHECKED_IN">("ALL");

  // Override check-in dialog state
  const [overrideTicket, setOverrideTicket] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState("");

  // 1. Fetch real Check-in statistics from Backend API
  const { data: statsData } = useQuery({
    queryKey: ["admin-checkin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/checkin/stats");
      return res.data.success ? res.data.data : { totalTickets: 0, checkedInCount: 0, uncheckedCount: 0, checkinRate: 0 };
    },
  });

  // 2. Fetch real tickets list from Backend API
  const { data: ticketsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-checkin-tickets", search],
    queryFn: async () => {
      const res = await api.get(`/admin/checkin${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      return res.data.success ? res.data.data : [];
    },
  });

  const tickets = Array.isArray(ticketsData) ? ticketsData : [];

  // 3. Verify QR Code Mutation
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post("/admin/checkin/verify", { ticketCode: code });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.alreadyCheckedIn) {
        toast.warning("Vé này ĐÃ ĐƯỢC SOÁT VÉ trước đó!", {
          description: `Chủ vé: ${data.data.holder} · ${data.data.event}`,
        });
      } else {
        toast.success("Soát vé mã QR thành công!", {
          description: `Khán giả: ${data.data.holder} · Loại vé: ${data.data.type}`,
        });
      }
      setScanResult(data.data);
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-stats"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Mã QR không hợp lệ hoặc không tồn tại!";
      toast.error("Lỗi kiểm tra mã QR", { description: msg });
      setScanResult(null);
    },
  });

  // 4. Override Check-in Mutation
  const overrideMutation = useMutation({
    mutationFn: async ({ ticketId, reason }: { ticketId: string; reason: string }) => {
      const res = await api.post("/admin/checkin/override", { ticketId, reason });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã duyệt soát vé thành công!");
      setOverrideTicket(null);
      setOverrideReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-stats"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi duyệt soát vé";
      toast.error(msg);
    },
  });

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) {
      toast.error("Vui lòng nhập mã QR trên phôi vé");
      return;
    }
    verifyMutation.mutate(scanInput.trim());
  };

  const filteredTickets = tickets.filter((t: any) => {
    if (statusFilter === "CHECKED_IN" && !t.isCheckedIn) return false;
    if (statusFilter === "NOT_CHECKED_IN" && t.isCheckedIn) return false;
    return true;
  });

  const stats = statsData || { totalTickets: 0, checkedInCount: 0, uncheckedCount: 0, checkinRate: 0 };

  const handleOpenModal = (ticket: any) => {
    setModalTicket({
      ticketCode: ticket.ticketCode || ticket.id,
      eventTitle: ticket.eventTitle || ticket.event,
      bannerUrl: ticket.bannerUrl,
      category: ticket.category || "Sự kiện",
      ticketType: ticket.ticketType || ticket.type || "Vé Tiêu Chuẩn",
      startDate: ticket.startDate || new Date(),
      venue: ticket.venue || "Địa điểm sự kiện",
      city: ticket.city || "Việt Nam",
      seatInfo: ticket.seatInfo,
      status: ticket.status || "CONFIRMED",
      isCheckedIn: ticket.isCheckedIn,
      holderName: ticket.buyerName || ticket.holder,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <QrCode className="h-7 w-7 text-primary" /> Vé Điện Tử & Trung Tâm Soát Vé
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quét mã QR Code kiểm soát vào cổng, tra cứu phôi vé điện tử và xử lý duyệt soát vé khẩn cấp thời gian thực.
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

      {/* Real Check-in Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Tổng Số Vé Phát Hành</p>
            <p className="text-2xl font-black text-foreground mt-1">{stats.totalTickets}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Đã Soát Vé Vào Cổng</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.checkedInCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Chưa Soát Vé</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.uncheckedCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-primary font-semibold uppercase">Tỷ Lệ Soát Vé (%)</p>
            <p className="text-2xl font-black mt-1 text-primary">{stats.checkinRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Scanner Form */}
      <Card className="rounded-3xl border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
            <Scan className="h-5 w-5 text-primary" /> Quét Mã QR Code Kiểm Soát Vào Cửa
          </CardTitle>
          <CardDescription>
            Quét mã QR Code trên phôi vé điện tử bằng máy quét/camera hoặc nhập mã vé trực tiếp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Scan className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Quét hoặc nhập mã vé QR Code..."
                className="pl-11 h-12 rounded-2xl font-mono text-base tracking-wider bg-background border-border/80 uppercase shadow-xs focus-visible:ring-2 focus-visible:ring-primary"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={verifyMutation.isPending}
              className="rounded-2xl h-12 px-6 font-extrabold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            >
              {verifyMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
              Soát Vé
            </Button>
          </form>

          {/* Last Check-in Result Card */}
          {scanResult && (
            <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 flex items-start gap-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm text-foreground">{scanResult.event}</p>
                  <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                    {scanResult.ticketCode}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Chủ vé: <strong className="text-foreground">{scanResult.holder}</strong> ({scanResult.email}) · Hạng vé: <strong className="text-primary">{scanResult.type}</strong>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  ✓ Cho phép khán giả qua cổng kiểm soát.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets List Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TicketIcon className="h-5 w-5 text-primary" /> Tra Cứu Danh Sách Phôi Vé Điện Tử
              </CardTitle>
              <CardDescription>Danh sách mã vé QR Code đã thanh toán trên hệ thống.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === "ALL" ? "default" : "outline"}
                size="sm"
                className="rounded-xl text-xs font-bold h-8"
                onClick={() => setStatusFilter("ALL")}
              >
                Tất cả ({tickets.length})
              </Button>
              <Button
                variant={statusFilter === "CHECKED_IN" ? "default" : "outline"}
                size="sm"
                className="rounded-xl text-xs font-bold h-8 text-emerald-600 border-emerald-500/30"
                onClick={() => setStatusFilter("CHECKED_IN")}
              >
                Đã soát vé ({stats.checkedInCount})
              </Button>
              <Button
                variant={statusFilter === "NOT_CHECKED_IN" ? "default" : "outline"}
                size="sm"
                className="rounded-xl text-xs font-bold h-8 text-amber-600 border-amber-500/30"
                onClick={() => setStatusFilter("NOT_CHECKED_IN")}
              >
                Chưa soát vé ({stats.uncheckedCount})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm vé theo mã QR Code, tên chủ vé, email, tên sự kiện..."
              className="pl-11 h-10 rounded-xl bg-card border-border/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-border/40 overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mã Vé QR Code</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Sự kiện</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Chủ vé</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao tác Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        Không tìm thấy vé nào phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-muted/20">
                        <TableCell>
                          <p className="font-mono font-extrabold text-sm text-primary">{t.ticketCode || t.id}</p>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Đơn: #{t.orderNumber}</p>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell">
                          <p className="text-sm font-bold text-foreground line-clamp-1">{t.eventTitle || t.event}</p>
                          <p className="text-xs text-muted-foreground">{t.ticketType || t.type}</p>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm font-semibold">{t.buyerName || t.holder}</p>
                          <p className="text-xs text-muted-foreground">{t.buyerEmail || t.email}</p>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={`font-bold ${
                              t.isCheckedIn
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            }`}
                          >
                            {t.isCheckedIn ? "✓ Đã soát vé" : "Chưa soát vé"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl h-8 text-xs font-bold gap-1 border-emerald-500/40 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10"
                              onClick={() => handleOpenModal(t)}
                            >
                              <QrCode className="h-3.5 w-3.5" /> Phôi vé QR
                            </Button>
                            {!t.isCheckedIn && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-xl h-8 text-xs font-bold gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                                onClick={() => {
                                  setOverrideTicket(t);
                                  setOverrideReason("");
                                }}
                              >
                                Duyệt Soát Vé
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Override Check-in Dialog with Audit Log confirmation */}
      <Dialog open={!!overrideTicket} onOpenChange={(open) => !open && setOverrideTicket(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Duyệt Soát Vé Trực Tiếp (Ghi Đè Soát Vé)
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs">
              Thao tác này sẽ bỏ qua quá trình quét mã vé QR Code và trực tiếp chuyển trạng thái vé sang ĐÃ SOÁT VÉ. Thao tác sẽ được ghi vết nhật ký hệ thống.
            </DialogDescription>
          </DialogHeader>

          {overrideTicket && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1 border border-border/50 text-xs">
                <p>Mã vé QR Code: <span className="font-mono font-bold text-primary">{overrideTicket.ticketCode || overrideTicket.id}</span></p>
                <p>Khán giả: <span className="font-bold">{overrideTicket.buyerName || overrideTicket.holder}</span></p>
                <p>Sự kiện: <span className="font-semibold">{overrideTicket.eventTitle || overrideTicket.event}</span></p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Lý do duyệt trực tiếp (Bắt buộc) *</label>
                <Textarea
                  placeholder="Ví dụ: Khách hàng xuất trình CCCD đối soát chính chủ do lỗi scanner tại cổng..."
                  className="rounded-xl text-xs min-h-[80px]"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => setOverrideTicket(null)}>
              Hủy bỏ
            </Button>
            <Button
              className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() =>
                overrideTicket &&
                overrideMutation.mutate({ ticketId: overrideTicket.id, reason: overrideReason })
              }
              disabled={overrideMutation.isPending || overrideReason.trim().length < 5}
            >
              {overrideMutation.isPending ? "Đang xử lý..." : "Xác nhận duyệt soát vé"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code ETicket Preview Modal */}
      <ETicketModal open={isModalOpen} onOpenChange={setIsModalOpen} ticket={modalTicket} />
    </div>
  );
}
