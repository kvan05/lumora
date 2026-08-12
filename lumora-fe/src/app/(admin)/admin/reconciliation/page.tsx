"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Scale, CheckCircle2, AlertTriangle, RefreshCw, Plus, FileText, ArrowRight, History, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function FinancialReconciliationPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState("30d");
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // Fetch 100% Real Reconciliation Data from Backend Engine
  const { data: reconData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-reconciliation", period],
    queryFn: async () => {
      const res = await api.get(`/admin/reconciliation?period=${period}`);
      return res.data.success ? res.data.data : null;
    },
  });

  const current = reconData?.current || {
    period: "30d",
    totalOrdersCount: 0,
    grossRevenue: 0,
    refundedAmount: 0,
    platformFee: 0,
    sellerPayout: 0,
    paidWithdrawalsAmount: 0,
    outstandingAmount: 0,
    expectedAmount: 0,
    actualAmount: 0,
    discrepancy: 0,
    status: "BALANCED",
  };

  const history = Array.isArray(reconData?.history) ? reconData.history : [];
  const isBalanced = current.discrepancy === 0;

  // Create Reconciliation Snapshot Mutation
  const snapshotMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/reconciliation", {
        periodName: `Đối soát ${period === "7d" ? "7 Ngày" : period === "90d" ? "90 Ngày" : "30 Ngày"} (${new Date().toLocaleDateString("vi-VN")})`,
        startDate: current.startDate,
        endDate: current.endDate,
        grossRevenue: current.grossRevenue,
        refundedAmount: current.refundedAmount,
        platformFee: current.platformFee,
        sellerPayout: current.sellerPayout,
        discrepancy: current.discrepancy,
        status: current.status,
        notes,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã chốt bản ghi kỳ đối soát tài chính thành công!");
      setIsSnapshotDialogOpen(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi lưu bản ghi đối soát");
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Scale className="h-7 w-7 text-primary" /> Financial Reconciliation Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Đối soát tài chính toàn sàn — Tự động kiểm tra khớp sổ sách Orders ↔ Payments ↔ Refunds ↔ Platform Fee (5%) ↔ Withdrawals.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 h-9 rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Ngày</SelectItem>
              <SelectItem value="30d">30 Ngày</SelectItem>
              <SelectItem value="90d">90 Ngày</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold gap-2 border-border/60"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới
          </Button>

          <Button
            size="sm"
            className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setIsSnapshotDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Chốt Kỳ Đối Soát
          </Button>
        </div>
      </div>

      {/* Balance Check Status Alert Banner */}
      <Card
        className={`rounded-3xl border shadow-xs overflow-hidden ${
          isBalanced
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}
      >
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                isBalanced ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
              }`}
            >
              {isBalanced ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
            </div>
            <div>
              <h2 className={`text-xl font-extrabold ${isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {isBalanced ? "✓ Financial records are balanced (Dữ liệu tài chính cân bằng 100%)" : "Financial discrepancy detected (Phát hiện chênh lệch tài chính)"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isBalanced
                  ? "Tất cả giao dịch Đơn hàng, Cổng thanh toán PayOS, Phí sàn 5% và Tiền trả Seller khớp tuyệt đối."
                  : `Phát hiện chênh lệch sổ sách: ${current.discrepancy.toLocaleString("vi-VN")} ₫. Vui lòng kiểm tra lại.`}
              </p>
            </div>
          </div>

          <Badge
            className={`font-black text-sm px-4 py-1.5 rounded-xl shrink-0 ${
              isBalanced ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {isBalanced ? "STATUS: BALANCED" : "STATUS: DISCREPANCY"}
          </Badge>
        </CardContent>
      </Card>

      {/* Financial Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-3.5 pb-3.5 px-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Tổng Đơn Hàng</p>
            <p className="text-lg font-black text-foreground mt-0.5">{current.totalOrdersCount} đơn</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-3.5 pb-3.5 px-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">Gross Revenue</p>
            <p className="text-lg font-black text-foreground mt-0.5">{current.grossRevenue.toLocaleString("vi-VN")} ₫</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-3.5 pb-3.5 px-3.5">
            <p className="text-[11px] font-semibold text-red-500 uppercase">Hoàn Tiền (Refund)</p>
            <p className="text-lg font-black text-red-500 mt-0.5">-{current.refundedAmount.toLocaleString("vi-VN")} ₫</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-3.5 pb-3.5 px-3.5">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase">Phí Sàn Lumora (5%)</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{current.platformFee.toLocaleString("vi-VN")} ₫</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-3.5 pb-3.5 px-3.5">
            <p className="text-[11px] font-semibold text-purple-600 uppercase">Seller Payout (95%)</p>
            <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">{current.sellerPayout.toLocaleString("vi-VN")} ₫</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-3.5 pb-3.5 px-3.5">
            <p className="text-[11px] font-semibold text-amber-600 uppercase">Đã Chi Trả (Withdraw)</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{current.paidWithdrawalsAmount.toLocaleString("vi-VN")} ₫</p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation History */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Lịch Sử Các Kỳ Đối Soát Đã Chốt (Reconciliation History)
          </CardTitle>
          <CardDescription>Bản ghi lưu trữ đối soát tài chính từ CSDL PostgreSQL.</CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs font-semibold">
              Chưa có kỳ đối soát tài chính nào được lưu trữ. Bấm &quot;Chốt Kỳ Đối Soát&quot; để lưu snapshot mới.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Tên Kỳ Đối Soát</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Khoảng Thời Gian</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Gross GMV</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Phí Sàn (5%)</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Chênh Lệch</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h: any) => (
                    <TableRow key={h.id} className="hover:bg-muted/20">
                      <TableCell className="font-bold text-xs text-foreground">
                        {h.periodName || `Kỳ ${h.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(h.startDate).toLocaleDateString("vi-VN")} - {new Date(h.endDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-xs">
                        {Number(h.grossRevenue || 0).toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-emerald-600">
                        {Number(h.platformFee || 0).toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        {Number(h.discrepancy || 0).toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`font-bold text-[10px] ${
                            h.status === "BALANCED" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                          }`}
                        >
                          {h.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Snapshot Dialog */}
      <Dialog open={isSnapshotDialogOpen} onOpenChange={setIsSnapshotDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> Chốt Bản Ghi Kỳ Đối Soát Tài Chính
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lưu bản ghi chốt kỳ đối soát tài chính của sàn vào CSDL PostgreSQL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="bg-muted/40 p-3 rounded-xl border space-y-1">
              <p>Chu kỳ: <span className="font-bold text-foreground">{period}</span></p>
              <p>Gross GMV: <span className="font-extrabold text-primary">{current.grossRevenue.toLocaleString("vi-VN")} ₫</span></p>
              <p>Phí sàn 5%: <span className="font-bold text-emerald-600">{current.platformFee.toLocaleString("vi-VN")} ₫</span></p>
              <p>Trạng thái đối soát: <span className="font-bold text-emerald-600">{current.status}</span></p>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Ghi chú kỳ đối soát (Notes):</label>
              <Textarea
                placeholder="Nhập ghi chú chốt sổ tài chính..."
                className="rounded-xl min-h-[70px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIsSnapshotDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => snapshotMutation.mutate()}
              disabled={snapshotMutation.isPending}
            >
              {snapshotMutation.isPending ? "Đang lưu..." : "Xác Nhận Lưu Snapshot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
