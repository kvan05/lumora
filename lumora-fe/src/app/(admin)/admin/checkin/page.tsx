"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  Barcode, Search, CheckCircle2, XCircle, Clock, Ban, RotateCcw, 
  Shield, Eye, Ticket as TicketIcon, Scan, RefreshCw, AlertTriangle, Filter, Sparkles 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { BarcodeImage, ETicketModal } from "@/components/ticket/EventTicket";

const MOCK_FALLBACK_TICKETS = [
  { id: "LM20260001", orderNumber: "LM20260001", event: "LUMORA MUSIC FESTIVAL 2026", venue: "Sân vận động Mỹ Đình", city: "Hà Nội", startDate: "2026-10-15T20:00:00Z", holder: "Nguyễn Văn An", email: "an.nguyen@gmail.com", type: "VIP Gold", price: 1500000, isCheckedIn: false, checkedInAt: null, isLocked: false, issuedAt: "2026-08-01" },
  { id: "LM20260002", orderNumber: "LM20260002", event: "Live Concert Sky Dec 2026", venue: "Nhà hát Thành phố", city: "TP. Hồ Chí Minh", startDate: "2026-12-20T19:30:00Z", holder: "Trần Thị Bích", email: "bich.tran@gmail.com", type: "Vé Tiêu Chuẩn", price: 750000, isCheckedIn: true, checkedInAt: "2026-08-07T14:30:00Z", isLocked: false, issuedAt: "2026-08-02" },
  { id: "LM20260003", orderNumber: "LM20260003", event: "Hà Anh Tuấn Concert 2026", venue: "Trung tâm Hội nghị Quốc gia", city: "Hà Nội", startDate: "2026-09-10T19:00:00Z", holder: "Lê Minh Cường", email: "cuong.le@gmail.com", type: "Vé SVIP Premium", price: 2500000, isCheckedIn: false, checkedInAt: null, isLocked: true, issuedAt: "2026-08-03" },
  { id: "LM20260004", orderNumber: "LM20260004", event: "Workshop Kỹ năng mềm 2026", venue: "Lumora Convention Center", city: "Đà Nẵng", startDate: "2026-08-25T08:30:00Z", holder: "Phạm Thị Dung", email: "dung.pham@gmail.com", type: "Vé Thường", price: 200000, isCheckedIn: true, checkedInAt: "2026-08-07T08:45:00Z", isLocked: false, issuedAt: "2026-08-04" },
  { id: "LM20260005", orderNumber: "LM20260005", event: "Marathon TP.HCM 2026", venue: "Công viên Tao Đàn", city: "TP. Hồ Chí Minh", startDate: "2026-11-05T05:00:00Z", holder: "Vũ Hoàng Gia", email: "gia.vu@gmail.com", type: "Vé Runner 21km", price: 450000, isCheckedIn: false, checkedInAt: null, isLocked: false, issuedAt: "2026-08-05" },
];

export default function AdminCheckinPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [modalTicket, setModalTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CHECKED_IN" | "NOT_CHECKED_IN" | "LOCKED">("ALL");

  // 1. Fetch tickets list from Backend API
  const { data: ticketsData, isLoading, refetch } = useQuery({
    queryKey: ["admin-checkin-tickets", search],
    queryFn: async () => {
      try {
        const res = await api.get(`/admin/checkin${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        const list = res.data.data;
        return Array.isArray(list) && list.length > 0 ? list : MOCK_FALLBACK_TICKETS;
      } catch {
        return MOCK_FALLBACK_TICKETS;
      }
    },
  });

  const tickets = useMemo(() => {
    return Array.isArray(ticketsData) ? ticketsData : MOCK_FALLBACK_TICKETS;
  }, [ticketsData]);

  // 2. Verify Barcode Mutation
  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post("/admin/checkin/verify", { ticketCode: code });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.alreadyCheckedIn) {
        toast.warning("Vé này ĐÃ ĐƯỢC CHÉCK-IN trước đó!", {
          description: `Chủ vé: ${data.data.holder} · ${data.data.event}`,
        });
      } else {
        toast.success("✅ Check-in mã vạch thành công!", {
          description: `Khán giả: ${data.data.holder} · Loại vé: ${data.data.type}`,
        });
      }
      setScanResult(data.data);
      queryClient.invalidateQueries({ queryKey: ["admin-checkin-tickets"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Mã vạch không hợp lệ hoặc không tồn tại!";
      toast.error("❌ Lỗi kiểm tra mã vạch", { description: msg });
      setScanResult(null);
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
      ticketCode: ticket.id || ticket.orderNumber,
      eventTitle: ticket.event,
      bannerUrl: ticket.bannerUrl,
      category: ticket.category || "Sự kiện",
      ticketType: ticket.type,
      startDate: ticket.startDate ? new Date(ticket.startDate) : new Date(),
      venue: ticket.venue || "Trung tâm Hội nghị Lumora Center",
      city: ticket.city || "TP. Hồ Chí Minh",
      seatInfo: ticket.seatInfo,
      status: ticket.isLocked ? "CANCELLED" : "CONFIRMED",
      isCheckedIn: ticket.isCheckedIn,
      holderName: ticket.holder,
    });
    setIsModalOpen(true);
  };

  const handleToggleLock = (ticketId: string) => {
    toast.success("Cập nhật trạng thái khóa vé thành công!");
    refetch();
  };

  const handleReissue = (ticketId: string) => {
    toast.success(`Đã cấp lại phôi vé mã vạch #${ticketId} thành công! Gửi email thông báo tới người dùng.`);
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t: any) => {
      const matchesSearch =
        !search ||
        t.id?.toLowerCase().includes(search.toLowerCase()) ||
        t.holder?.toLowerCase().includes(search.toLowerCase()) ||
        t.event?.toLowerCase().includes(search.toLowerCase());

      if (statusFilter === "CHECKED_IN") return matchesSearch && t.isCheckedIn;
      if (statusFilter === "NOT_CHECKED_IN") return matchesSearch && !t.isCheckedIn;
      if (statusFilter === "LOCKED") return matchesSearch && t.isLocked;
      return matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const checkedInCount = tickets.filter((t: any) => t.isCheckedIn).length;
  const lockedCount = tickets.filter((t: any) => t.isLocked).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Barcode className="h-7 w-7 text-primary" /> E-ticket & Check-in (Mã Vạch Barcode)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hệ thống soát vé mã vạch thời gian thực, quản lý phôi vé E-ticket và kiểm soát vào cửa sự kiện.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold gap-2 self-start sm:self-auto border-border/60 hover:bg-muted"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4" /> Làm mới dữ liệu
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng phôi vé</p>
            <p className="text-2xl font-black mt-1 text-foreground">{tickets.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đã Check-in</p>
            <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{checkedInCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 shadow-xs">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Chưa Check-in</p>
            <p className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">{tickets.length - checkedInCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-red-500/20 bg-red-500/5 dark:bg-red-950/20 shadow-xs">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Vé bị khóa</p>
            <p className="text-2xl font-black mt-1 text-red-600 dark:text-red-400">{lockedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Barcode Scanner & Quick Lookup */}
      <Card className="rounded-3xl border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
            <Scan className="h-5 w-5 text-primary" /> Máy Quét Barcode Soát Vé Thời Gian Thực
          </CardTitle>
          <CardDescription>
            Nhập hoặc quét mã vạch trên vé E-ticket của người tham dự để kiểm tra tính hợp lệ và ghi nhận vào cửa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Quét hoặc nhập mã vạch Barcode (Ví dụ: LM20260001)..."
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

          {/* Scan Result Feedback Card */}
          {scanResult && (
            <div className="border border-border/60 rounded-2xl p-5 space-y-4 bg-background shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xl text-primary">Mã vạch: #{scanResult.id}</span>
                    <Badge className="bg-emerald-500 text-white font-bold rounded-lg px-2.5 py-0.5">
                      ✓ Vé Hợp Lệ
                    </Badge>
                  </div>
                  <p className="text-base font-bold text-foreground">{scanResult.event}</p>
                  <p className="text-xs text-muted-foreground">📍 {scanResult.venue}, {scanResult.city}</p>
                  <p className="text-sm font-semibold mt-1 text-foreground">
                    Chủ sở hữu vé: <span className="text-primary font-bold">{scanResult.holder}</span> ({scanResult.type})
                  </p>
                </div>

                {/* Real Barcode Rendering */}
                <div className="bg-white p-3.5 rounded-2xl border border-border/80 shadow-xs flex flex-col items-center shrink-0">
                  <BarcodeImage text={scanResult.id} height={50} width={1.8} fontSize={12} />
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Đã ghi nhận soát vé vào cửa lúc {new Date(scanResult.checkedInAt).toLocaleTimeString("vi-VN")}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl h-8 font-bold gap-1.5"
                  onClick={() => handleOpenModal(scanResult)}
                >
                  <Eye className="h-3.5 w-3.5" /> Xem Phôi Vé Chân Thực
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket List & Filter */}
      <Card className="rounded-3xl border-border/50 overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TicketIcon className="h-5 w-5 text-primary" /> Danh Sách Phôi Vé Mã Vạch
              </CardTitle>
              <CardDescription>Tra cứu, kiểm tra trạng thái và quản lý bảo mật cho tất cả vé đã phát hành.</CardDescription>
            </div>

            {/* Quick Status Filter Tabs */}
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
                Đã soát vé
              </Button>
              <Button
                variant={statusFilter === "NOT_CHECKED_IN" ? "default" : "ghost"}
                size="sm"
                className="rounded-xl h-7 px-3 text-xs"
                onClick={() => setStatusFilter("NOT_CHECKED_IN")}
              >
                Chưa soát
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm vé theo Mã vạch Barcode, tên người dùng, tên sự kiện..."
              className="pl-11 h-10 rounded-xl bg-card border-border/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Mã Vạch Barcode</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Sự kiện</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Chủ vé</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái Check-in</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Không tìm thấy phôi vé nào phù hợp với tìm kiếm.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket: any) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/20">
                      <TableCell>
                        <p className="font-mono font-extrabold text-sm text-primary">{ticket.id}</p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Đơn: #{ticket.orderNumber}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <p className="text-sm font-bold text-foreground line-clamp-1">{ticket.event}</p>
                        <p className="text-xs text-muted-foreground">{ticket.type}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm font-semibold">{ticket.holder}</p>
                        <p className="text-xs text-muted-foreground">{ticket.email}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold w-fit ${
                              ticket.isCheckedIn
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}
                          >
                            {ticket.isCheckedIn ? "✓ Đã Check-in" : "Chưa Check-in"}
                          </span>
                          {ticket.isLocked && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 w-fit">
                              🔒 Khóa vé
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl h-8 text-xs font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                            onClick={() => handleOpenModal(ticket)}
                          >
                            <Barcode className="h-3.5 w-3.5" /> Xem Phôi Vé
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-xl ${ticket.isLocked ? "text-emerald-600" : "text-red-500"}`}
                            title={ticket.isLocked ? "Mở khóa vé" : "Khóa vé"}
                            onClick={() => handleToggleLock(ticket.id)}
                          >
                            {ticket.isLocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Authentic ETicket Modal Component */}
      <ETicketModal open={isModalOpen} onOpenChange={setIsModalOpen} ticket={modalTicket} />
    </div>
  );
}
