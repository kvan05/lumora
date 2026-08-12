"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  Barcode, Search, CheckCircle2, XCircle, Clock, ShieldCheck, Eye, Ticket as TicketIcon, Scan, RefreshCw, AlertTriangle
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
import { BarcodeImage, ETicketModal } from "@/components/ticket/EventTicket";

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

  // 3. Verify Barcode Mutation
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post("/admin/checkin/verify", { ticketCode: code });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.alreadyCheckedIn) {
        toast.warning("Vé này ĐÃ ĐƯỢC CHECK-IN trước đó!", {
          description: `Chủ vé: ${data.data.holder} · ${data.data.event}`,
        });
      } else {
        toast.success("Check-in mã vạch thành công!", {
          description: `Khán giả: ${data.data.holder} · Loại vé: ${data.data.type}`,
        });
      }
      setScanResult(data.data);
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-stats"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Mã vạch không hợp lệ hoặc không tồn tại!";
      toast.error("Lỗi kiểm tra mã vạch", { description: msg });
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
      toast.success(data.message || "Đã ép duyệt Check-in thành công!");
      setOverrideTicket(null);
      setOverrideReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-stats"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi ép duyệt Check-in";
      toast.error(msg);
    },
  });

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) {
      toast.error("Vui lòng nhập hoặc quét mã vạch Barcode!");
      return;
    }
    verifyMutation.mutate(scanInput.trim());
  };

  const handleOpenModal = (ticket: any) => {
    setModalTicket({
      ticketCode: ticket.ticketCode || ticket.id,
      eventTitle: ticket.eventTitle || ticket.event,
      bannerUrl: ticket.bannerUrl,
      category: ticket.category || "Sự kiện",
      ticketType: ticket.ticketType || ticket.type,
      startDate: ticket.startDate ? new Date(ticket.startDate) : new Date(),
      venue: ticket.venue || "Địa điểm sự kiện",
      city: ticket.city || "Việt Nam",
      seatInfo: ticket.seatInfo,
      status: ticket.orderStatus || "CONFIRMED",
      isCheckedIn: ticket.isCheckedIn,
      holderName: ticket.buyerName || ticket.holder,
    });
    setIsModalOpen(true);
  };

  const filteredTickets = tickets.filter((t: any) => {
    const matchesSearch =
      !search ||
      t.ticketCode?.toLowerCase().includes(search.toLowerCase()) ||
      t.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
      t.eventTitle?.toLowerCase().includes(search.toLowerCase()) ||
      t.orderNumber?.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "CHECKED_IN") return matchesSearch && t.isCheckedIn;
    if (statusFilter === "NOT_CHECKED_IN") return matchesSearch && !t.isCheckedIn;
    return matchesSearch;
  });

  const stats = statsData || { totalTickets: 0, checkedInCount: 0, uncheckedCount: 0, checkinRate: 0 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Barcode className="h-7 w-7 text-primary" /> E-ticket & Check-in (Mã Vạch Barcode)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hệ thống kiểm soát vé mã vạch thời gian thực và ép duyệt Check-in quản trị viên có lưu nhật ký Audit Log.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold gap-2 self-start sm:self-auto border-border/60 hover:bg-muted"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới dữ liệu
        </Button>
      </div>

      {/* Real Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng số vé đã xuất</p>
            <p className="text-2xl font-black mt-1 text-foreground">{stats.totalTickets}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đã Check-in</p>
            <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{stats.checkedInCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 shadow-xs">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Chưa Check-in</p>
            <p className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">{stats.uncheckedCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Tỷ lệ Check-in</p>
            <p className="text-2xl font-black mt-1 text-primary">{stats.checkinRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Barcode Scanner Form */}
      <Card className="rounded-3xl border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
            <Scan className="h-5 w-5 text-primary" /> Máy Quét Mã Vạch Barcode Kiểm Soát Vào Cửa
          </CardTitle>
          <CardDescription>
            Quét mã vạch Barcode CODE128 trên phôi vé điện tử bằng đầu đọc mã vạch hoặc nhập mã vé trực tiếp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Quét hoặc nhập mã vạch Barcode CODE128..."
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

          {/* Scan Result Feedback */}
          {scanResult && (
            <div className="border border-border/60 rounded-2xl p-5 space-y-4 bg-background shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xl text-primary">Mã vạch: #{scanResult.id}</span>
                    <Badge className="bg-emerald-500 text-white font-bold rounded-lg px-2.5 py-0.5">
                      Vé Hợp Lệ
                    </Badge>
                  </div>
                  <p className="text-base font-bold text-foreground">{scanResult.event}</p>
                  <p className="text-xs text-muted-foreground">{scanResult.venue}, {scanResult.city}</p>
                  <p className="text-sm font-semibold mt-1 text-foreground">
                    Chủ vé: <span className="text-primary font-bold">{scanResult.holder}</span> ({scanResult.type})
                  </p>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-border/80 shadow-xs flex flex-col items-center shrink-0">
                  <BarcodeImage text={scanResult.id} height={45} width={1.6} fontSize={11} />
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Đã ghi nhận Check-in lúc {new Date(scanResult.checkedInAt).toLocaleTimeString("vi-VN")}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl h-8 font-bold gap-1.5"
                  onClick={() => handleOpenModal(scanResult)}
                >
                  <Eye className="h-3.5 w-3.5" /> Xem Phôi Vé Barcode
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Table */}
      <Card className="rounded-3xl border-border/50 overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TicketIcon className="h-5 w-5 text-primary" /> Danh Sách Phôi Vé Điện Tử Toàn Hệ Thống
              </CardTitle>
              <CardDescription>Tra cứu danh sách vé phát hành từ dữ liệu PostgreSQL Neon.</CardDescription>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/40 text-xs font-semibold">
              <Button
                variant={statusFilter === "ALL" ? "default" : "ghost"}
                size="sm"
                className="rounded-xl h-7 px-3 text-xs"
                onClick={() => setStatusFilter("ALL")}
              >
                Tất cả ({tickets.length})
              </Button>
              <Button
                variant={statusFilter === "CHECKED_IN" ? "default" : "ghost"}
                size="sm"
                className="rounded-xl h-7 px-3 text-xs"
                onClick={() => setStatusFilter("CHECKED_IN")}
              >
                Đã Check-in
              </Button>
              <Button
                variant={statusFilter === "NOT_CHECKED_IN" ? "default" : "ghost"}
                size="sm"
                className="rounded-xl h-7 px-3 text-xs"
                onClick={() => setStatusFilter("NOT_CHECKED_IN")}
              >
                Chưa Check-in
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm vé theo mã vạch Barcode, tên chủ vé, email, tên sự kiện..."
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mã Vạch Barcode</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Sự kiện</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Chủ vé (Buyer)</TableHead>
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
                            {t.isCheckedIn ? "✓ Đã Check-in" : "Chưa Check-in"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl h-8 text-xs font-bold gap-1 border-primary/40 text-primary"
                              onClick={() => handleOpenModal(t)}
                            >
                              <Barcode className="h-3.5 w-3.5" /> Xem Phôi Vé
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
                                Ép Check-in
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
              <AlertTriangle className="h-5 w-5" /> Ép Duyệt Check-in Thủ Công (Admin Override)
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs">
              Thao tác này sẽ bỏ qua quá trình quét mã vạch Barcode và trực tiếp chuyển trạng thái vé sang ĐÃ CHECK-IN. Thao tác sẽ được ghi vết nhật ký Audit Log.
            </DialogDescription>
          </DialogHeader>

          {overrideTicket && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1 border border-border/50 text-xs">
                <p>Mã vé: <span className="font-mono font-bold text-primary">{overrideTicket.ticketCode || overrideTicket.id}</span></p>
                <p>Khán giả: <span className="font-bold">{overrideTicket.buyerName || overrideTicket.holder}</span></p>
                <p>Sự kiện: <span className="font-semibold">{overrideTicket.eventTitle || overrideTicket.event}</span></p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Lý do ép duyệt Check-in (Bắt buộc) *</label>
                <Textarea
                  placeholder="Ví dụ: Khách hàng mang CCCD đối soát chính chủ do lỗi scanner tại cổng..."
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
              {overrideMutation.isPending ? "Đang xử lý..." : "Xác nhận Override Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Ticket Modal */}
      <ETicketModal open={isModalOpen} onOpenChange={setIsModalOpen} ticket={modalTicket} />
    </div>
  );
}
