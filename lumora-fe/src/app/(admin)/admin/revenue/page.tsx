"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  TrendingUp, Wallet, Banknote, Clock, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, Building2, Search, Filter, Plus, FileText,
  DollarSign, ArrowUpRight, X, ChevronRight
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  PENDING:    { label: "Chờ xử lý",  className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  PROCESSING: { label: "Đang xử lý", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  COMPLETED:  { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  REJECTED:   { label: "Từ chối",   className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState("withdrawals");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states for Process Withdrawal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [processStatus, setProcessStatus] = useState<string>("COMPLETED");
  const [adminNote, setAdminNote] = useState("");
  const [isProcessingW, setIsProcessingW] = useState(false);

  // Modal states for Create Settlement
  const [showCreateSettlement, setShowCreateSettlement] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [commissionRate, setCommissionRate] = useState("0.07");
  const [perTicketFee, setPerTicketFee] = useState("5000");
  const [isCreatingS, setIsCreatingS] = useState(false);

  // Queries
  const { data: withdrawals, isLoading: loadingW, refetch: refetchW } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const res = await api.get("/admin/withdrawals");
      return res.data.data as any[];
    },
  });

  const { data: settlements, isLoading: loadingS, refetch: refetchS } = useQuery({
    queryKey: ["admin-settlements"],
    queryFn: async () => {
      const res = await api.get("/admin/settlements");
      return res.data.data as any[];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["admin-events-list"],
    queryFn: async () => {
      const res = await api.get("/admin/events");
      return (Array.isArray(res.data.data) ? res.data.data : res.data.data?.events || []) as any[];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin-stats-overview"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data.data;
    },
  });

  // Action: Process Withdrawal
  const handleProcessWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    setIsProcessingW(true);
    try {
      const res = await api.patch(`/admin/withdrawals/${selectedWithdrawal.id}`, {
        status: processStatus,
        adminNote: adminNote.trim() || undefined,
      });
      toast.success(res.data.message || `Đã cập nhật trạng thái thành ${processStatus}`);
      setSelectedWithdrawal(null);
      setAdminNote("");
      refetchW();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Không thể cập nhật yêu cầu");
    } finally {
      setIsProcessingW(false);
    }
  };

  // Action: Create Settlement
  const handleCreateSettlement = async () => {
    if (!selectedEventId) {
      toast.error("Vui lòng chọn sự kiện");
      return;
    }
    setIsCreatingS(true);
    try {
      const res = await api.post("/admin/settlements", {
        eventId: selectedEventId,
        commissionRate: Number(commissionRate),
        perTicketFee: Number(perTicketFee),
      });
      toast.success(res.data.message || "Tạo bảng đối soát thành công");
      setShowCreateSettlement(false);
      setSelectedEventId("");
      refetchS();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Không thể tạo bảng đối soát");
    } finally {
      setIsCreatingS(false);
    }
  };

  // Action: Process Settlement
  const handleProcessSettlement = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/admin/settlements/${id}`, { status: newStatus });
      toast.success(res.data.message || "Đã cập nhật đối soát");
      refetchS();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Thao tác thất bại");
    }
  };

  // Filters
  const filteredWithdrawals = (withdrawals || []).filter((w: any) => {
    const matchStatus = statusFilter === "ALL" || w.status === statusFilter;
    const matchSearch =
      w.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.seller?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.bankName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.accountNumber?.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const filteredSettlements = (settlements || []).filter((s: any) => {
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchSearch =
      s.event?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.event?.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + " ₫";

  const pendingWithdrawalsCount = (withdrawals || []).filter((w: any) => w.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Quản lý Tài chính & Rút tiền
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Duyệt yêu cầu rút tiền của Organizer và quản lý các bảng đối soát sự kiện (Escrow).
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Tổng doanh thu sàn</p>
            <p className="text-xl font-black mt-1 text-emerald-600">{fmt(statsData?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Phí sàn ước tính (5%)</p>
            <p className="text-xl font-black mt-1 text-primary">{fmt(statsData?.platformFee || 0)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Yêu cầu rút tiền chờ duyệt</p>
            <p className="text-xl font-black mt-1 text-amber-600 flex items-center gap-2">
              {pendingWithdrawalsCount} đơn
              {pendingWithdrawalsCount > 0 && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground font-medium">Số đối soát sự kiện</p>
            <p className="text-xl font-black mt-1 text-blue-600">{(settlements || []).length} bảng</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="withdrawals" onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="withdrawals" className="rounded-lg font-bold text-sm gap-2">
              <Banknote className="h-4 w-4" /> Rút tiền (Organizer)
              {pendingWithdrawalsCount > 0 && (
                <Badge className="bg-amber-500 text-white ml-1 px-1.5 py-0 text-[10px]">
                  {pendingWithdrawalsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settlements" className="rounded-lg font-bold text-sm gap-2">
              <FileText className="h-4 w-4" /> Bảng đối soát sự kiện
            </TabsTrigger>
          </TabsList>

          {/* Search and Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-9 h-9 text-sm rounded-xl"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="REJECTED">Từ chối</option>
            </select>
            {activeTab === "settlements" && (
              <Button onClick={() => setShowCreateSettlement(true)} className="h-9 rounded-xl font-bold gap-1 text-xs">
                <Plus className="h-4 w-4" /> Tạo đối soát
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: WITHDRAWALS */}
        <TabsContent value="withdrawals" className="m-0">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold text-xs uppercase">Organizer</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Số tiền rút</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Ngân hàng & Số tài khoản</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Thời gian gửi</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Trạng thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingW ? (
                    [...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredWithdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Không có yêu cầu rút tiền nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWithdrawals.map((w: any) => (
                      <TableRow key={w.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div>
                            <p className="font-bold text-sm">{w.seller?.name || "Organizer"}</p>
                            <p className="text-xs text-muted-foreground">{w.seller?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-black text-sm text-emerald-600">{fmt(Number(w.amount))}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p className="font-bold">{w.bankName}</p>
                            <p className="font-mono text-muted-foreground">{w.accountNumber}</p>
                            <p className="uppercase text-[11px] text-muted-foreground">{w.accountHolder}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(w.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGES[w.status]?.className || ""}>
                            {STATUS_BADGES[w.status]?.label || w.status}
                          </Badge>
                          {w.adminNote && (
                            <p className="text-[11px] text-muted-foreground mt-1 max-w-[150px] truncate" title={w.adminNote}>
                              Ghi chú: {w.adminNote}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={w.status === "PENDING" ? "default" : "outline"}
                            className="rounded-xl font-bold text-xs gap-1"
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setProcessStatus(w.status === "PENDING" ? "COMPLETED" : w.status);
                              setAdminNote(w.adminNote || "");
                            }}
                          >
                            Xử lý / Duyệt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: SETTLEMENTS */}
        <TabsContent value="settlements" className="m-0">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold text-xs uppercase">Sự kiện & Organizer</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Doanh thu vé</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Phí sàn (7%)</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Thực nhận</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-center">Trạng thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingS ? (
                    [...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredSettlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Chưa có bảng đối soát nào. Bấm &quot;Tạo đối soát&quot; để tạo cho sự kiện.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSettlements.map((s: any) => (
                      <TableRow key={s.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div>
                            <p className="font-bold text-sm">{s.event?.title}</p>
                            <p className="text-xs text-muted-foreground">{s.event?.seller?.name} ({s.event?.seller?.email})</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">{fmt(Number(s.grossRevenue))}</TableCell>
                        <TableCell className="text-right font-semibold text-sm text-amber-600">{fmt(Number(s.commissionFee))}</TableCell>
                        <TableCell className="text-right font-black text-sm text-emerald-600">{fmt(Number(s.netAmount))}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={STATUS_BADGES[s.status]?.className || ""}>
                            {STATUS_BADGES[s.status]?.label || s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === "PENDING" && (
                            <Button
                              size="sm"
                              className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleProcessSettlement(s.id, "COMPLETED")}
                            >
                              Hoàn thành
                            </Button>
                          )}
                          {s.status === "COMPLETED" && (
                            <span className="text-xs text-muted-foreground font-semibold">Đã chuyển</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Process Withdrawal */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" /> Duyệt yêu cầu rút tiền
            </DialogTitle>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4 py-2">
              {/* Account Details Box */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nhà tổ chức:</span>
                  <span className="font-bold">{selectedWithdrawal.seller?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tiền yêu cầu:</span>
                  <span className="font-black text-emerald-600 text-base">{fmt(Number(selectedWithdrawal.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngân hàng:</span>
                  <span className="font-bold">{selectedWithdrawal.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tài khoản:</span>
                  <span className="font-mono font-bold">{selectedWithdrawal.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chủ tài khoản:</span>
                  <span className="font-bold uppercase">{selectedWithdrawal.accountHolder}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trạng thái duyệt</label>
                <select
                  value={processStatus}
                  onChange={e => setProcessStatus(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold focus:outline-none"
                >
                  <option value="COMPLETED">Hoàn thành (Đã chuyển khoản)</option>
                  <option value="PROCESSING">Đang xử lý chuyển tiền</option>
                  <option value="REJECTED">Từ chối yêu cầu</option>
                </select>
              </div>

              {/* Admin Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ghi chú của Admin</label>
                <Textarea
                  placeholder="VD: Đã chuyển khoản qua Internet Banking mã GD #98214... hoặc Lý do từ chối"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  className="resize-none min-h-[80px] rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSelectedWithdrawal(null)} className="rounded-xl">Hủy</Button>
            <Button onClick={handleProcessWithdrawal} disabled={isProcessingW} className="rounded-xl font-bold">
              {isProcessingW ? "Đang luôn..." : "Lưu trạng thái"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Create Settlement */}
      <Dialog open={showCreateSettlement} onOpenChange={setShowCreateSettlement}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Tạo bảng đối soát sự kiện
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chọn sự kiện <span className="text-destructive">*</span></label>
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold focus:outline-none"
              >
                <option value="">-- Chọn sự kiện cần đối soát --</option>
                {(events || []).map((e: any) => (
                  <option key={e.id} value={e.id}>{e.title} ({e.city})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tỷ lệ hoa hồng</label>
                <Input
                  type="number"
                  step="0.01"
                  value={commissionRate}
                  onChange={e => setCommissionRate(e.target.value)}
                  className="rounded-xl text-sm"
                />
                <p className="text-[11px] text-muted-foreground">0.07 = 7% hoa hồng sàn</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phí cố định/vé (₫)</label>
                <Input
                  type="number"
                  value={perTicketFee}
                  onChange={e => setPerTicketFee(e.target.value)}
                  className="rounded-xl text-sm"
                />
                <p className="text-[11px] text-muted-foreground">Mặc định 5,000 ₫/vé</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowCreateSettlement(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={handleCreateSettlement} disabled={isCreatingS || !selectedEventId} className="rounded-xl font-bold">
              {isCreatingS ? "Đang tính..." : "Tính & Tạo đối soát"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
