"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Tag, Plus, Search, Trash2, CheckCircle2, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "EXHAUSTED" | "EXPIRED">("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscount: 50000,
    minOrderValue: 100000,
    usageLimit: 100,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  // 1. Fetch 100% Real Vouchers Data from Backend API
  const { data: vouchersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: async () => {
      const res = await api.get("/admin/vouchers");
      return res.data.success ? res.data.data : [];
    },
  });

  const vouchers = Array.isArray(vouchersData) ? vouchersData : [];

  // Helper for voucher status
  const getVoucherStatus = (v: any) => {
    const now = new Date();
    const end = new Date(v.endDate);
    if (v.usageLimit && v.usedCount >= v.usageLimit) return "EXHAUSTED";
    if (end < now) return "EXPIRED";
    return "ACTIVE";
  };

  // Filtered Vouchers
  const filtered = vouchers.filter((v: any) => {
    const matchSearch = !search || v.code.toLowerCase().includes(search.toLowerCase());
    const status = getVoucherStatus(v);
    const matchFilter = activeFilter === "ALL" || status === activeFilter;
    return matchSearch && matchFilter;
  });

  // Create Voucher Mutation
  const createVoucherMutation = useMutation({
    mutationFn: async () => {
      if (!formData.code.trim()) throw new Error("Vui lòng nhập mã Voucher.");
      const res = await api.post("/admin/vouchers", formData);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Tạo mã giảm giá thành công!");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Lỗi tạo mã giảm giá");
    },
  });

  // Delete Voucher Mutation
  const deleteVoucherMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/vouchers/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã xóa mã giảm giá!");
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Lỗi xóa mã giảm giá");
    },
  });

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}" không?`)) {
      deleteVoucherMutation.mutate(id);
    }
  };

  // Metrics
  const totalCount = vouchers.length;
  const activeCount = vouchers.filter((v: any) => getVoucherStatus(v) === "ACTIVE").length;
  const exhaustedCount = vouchers.filter((v: any) => getVoucherStatus(v) === "EXHAUSTED").length;
  const expiredCount = vouchers.filter((v: any) => getVoucherStatus(v) === "EXPIRED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Tag className="h-7 w-7 text-primary" /> Quản Lý Mã Giảm Giá & Khuyến Mãi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo và quản lý các chương trình ưu đãi, mã Voucher kích cầu giao dịch cho toàn sàn Lumora.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold gap-2 border-border/60"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới
          </Button>
          <Button className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Tạo Mã Giảm Giá
          </Button>
        </div>
      </div>

      {/* 4 Interactive Clickable Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <Card
          onClick={() => setActiveFilter("ALL")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "ALL"
              ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md scale-[1.02]"
              : "border-border/50 bg-card hover:border-primary/50 hover:bg-muted/20"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Tổng Số Voucher</p>
            <p className="text-2xl font-black text-foreground mt-1">{totalCount}</p>
          </CardContent>
        </Card>

        {/* Card 2: Active */}
        <Card
          onClick={() => setActiveFilter("ACTIVE")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "ACTIVE"
              ? "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]"
              : "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đang Hoạt Động</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
          </CardContent>
        </Card>

        {/* Card 3: Exhausted */}
        <Card
          onClick={() => setActiveFilter("EXHAUSTED")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "EXHAUSTED"
              ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-md scale-[1.02]"
              : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Hết Lượt Dùng</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{exhaustedCount}</p>
          </CardContent>
        </Card>

        {/* Card 4: Expired */}
        <Card
          onClick={() => setActiveFilter("EXPIRED")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "EXPIRED"
              ? "border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/30 shadow-md scale-[1.02]"
              : "border-purple-500/20 bg-purple-500/5 hover:border-purple-500 hover:bg-purple-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Đã Hết Hạn</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{expiredCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm mã khuyến mãi..."
              className="pl-9 h-10 rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Hiển thị <strong className="text-foreground">{filtered.length}</strong> voucher
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Chưa có mã giảm giá nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mã / Đơn Tối Thiểu</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mức Giảm Giá</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Tiến Độ Sử Dụng</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Thời Gian Áp Dụng</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng Thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v: any) => {
                    const st = getVoucherStatus(v);
                    const usagePct = v.usageLimit ? Math.min(100, Math.round((v.usedCount / v.usageLimit) * 100)) : 0;
                    return (
                      <TableRow key={v.id} className="hover:bg-muted/20">
                        <TableCell>
                          <span className="font-black text-sm font-mono px-3 py-1 bg-primary/10 text-primary rounded-xl border border-primary/20">
                            {v.code}
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                            Đơn tối thiểu: {Number(v.minOrderValue || 0).toLocaleString("vi-VN")} ₫
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            {v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : `${Number(v.discountValue).toLocaleString("vi-VN")} ₫`}
                          </p>
                          {v.discountType === "PERCENTAGE" && v.maxDiscount && (
                            <p className="text-[10px] text-muted-foreground font-medium">
                              Tối đa {Number(v.maxDiscount).toLocaleString("vi-VN")} ₫
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-xs font-bold text-foreground">
                            {v.usedCount || 0} / {v.usageLimit || "∞"} lượt
                          </div>
                          {v.usageLimit > 0 && (
                            <div className="w-28 h-2 bg-muted rounded-full overflow-hidden mt-1">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${usagePct}%` }} />
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">{new Date(v.startDate).toLocaleDateString("vi-VN")}</p>
                          <p>đến {new Date(v.endDate).toLocaleDateString("vi-VN")}</p>
                        </TableCell>

                        <TableCell>
                          {st === "ACTIVE" && (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold text-[11px]">
                              Đang hoạt động
                            </Badge>
                          )}
                          {st === "EXHAUSTED" && (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-[11px]">
                              Hết lượt dùng
                            </Badge>
                          )}
                          {st === "EXPIRED" && (
                            <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold text-[11px]">
                              Đã hết hạn
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(v.id, v.code)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Voucher Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">Tạo Mã Giảm Giá Mới</DialogTitle>
            <DialogDescription className="text-xs">Tạo mã Voucher ưu đãi áp dụng toàn sàn.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Mã Voucher (Code) *</Label>
              <Input
                placeholder="VD: LUMORA2026"
                className="rounded-xl h-10 font-mono uppercase"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Loại giảm giá</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(val) => setFormData({ ...formData, discountType: val })}
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
                    <SelectItem value="FIXED">Số tiền cố định (₫)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Mức giảm *</Label>
                <Input
                  type="number"
                  placeholder="10"
                  className="rounded-xl h-10"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Đơn tối thiểu (₫)</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  className="rounded-xl h-10"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Giới hạn lượt dùng</Label>
                <Input
                  type="number"
                  placeholder="100"
                  className="rounded-xl h-10"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Ngày bắt đầu</Label>
                <Input
                  type="date"
                  className="rounded-xl h-10"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Ngày kết thúc</Label>
                <Input
                  type="date"
                  className="rounded-xl h-10"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
              onClick={() => createVoucherMutation.mutate()}
              disabled={createVoucherMutation.isPending}
            >
              {createVoucherMutation.isPending ? "Đang tạo..." : "Tạo Mã"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
