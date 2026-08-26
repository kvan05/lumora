"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Flag, AlertTriangle, ShieldAlert, CheckCircle2, Ban, Trash2, Search, RefreshCw, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "HIGH" | "RESOLVED">("ALL");

  // Fetch 100% Real Risk & Violation Reports from Backend API
  const { data: alertsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-risk-reports"],
    queryFn: async () => {
      const res = await api.get("/admin/risk-alerts");
      return res.data.success ? res.data.data : [];
    },
  });

  const alerts = Array.isArray(alertsData) ? alertsData : [];

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNote }: { id: string; status: string; resolutionNote?: string }) => {
      const res = await api.patch(`/admin/risk-alerts/${id}`, { status, resolutionNote });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật trạng thái xử lý vi phạm thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-risk-reports"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Lỗi xử lý vi phạm");
    },
  });

  // Filtered reports
  const filtered = alerts.filter((r: any) => {
    const matchSearch =
      !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.targetName?.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === "ALL"
        ? true
        : activeFilter === "PENDING"
        ? r.status === "OPEN" || r.status === "PENDING"
        : activeFilter === "HIGH"
        ? r.severity === "HIGH" || r.severity === "CRITICAL"
        : r.status === "RESOLVED" || r.status === "CLOSED";

    return matchSearch && matchFilter;
  });

  // Metrics
  const totalCount = alerts.length;
  const pendingCount = alerts.filter((r: any) => r.status === "OPEN" || r.status === "PENDING").length;
  const highRiskCount = alerts.filter((r: any) => r.severity === "HIGH" || r.severity === "CRITICAL").length;
  const resolvedCount = alerts.filter((r: any) => r.status === "RESOLVED" || r.status === "CLOSED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Flag className="h-7 w-7 text-primary" /> Xử Lý Báo Cáo Vi Phạm & Khiếu Nại
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tiếp nhận, thẩm định và xử lý các báo cáo vi phạm sự kiện, tài khoản và hành vi gian lận trên sàn.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold gap-2 border-border/60 self-start sm:self-auto"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới
        </Button>
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
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Tổng Số Báo Cáo</p>
            <p className="text-2xl font-black text-foreground mt-1">{totalCount}</p>
          </CardContent>
        </Card>

        {/* Card 2: High Risk */}
        <Card
          onClick={() => setActiveFilter("HIGH")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "HIGH"
              ? "border-red-500 bg-red-500/15 ring-2 ring-red-500/30 shadow-md scale-[1.02]"
              : "border-red-500/20 bg-red-500/5 hover:border-red-500 hover:bg-red-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">Mức Độ Nghiêm Trọng</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{highRiskCount}</p>
          </CardContent>
        </Card>

        {/* Card 3: Pending */}
        <Card
          onClick={() => setActiveFilter("PENDING")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "PENDING"
              ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-md scale-[1.02]"
              : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Chờ Xử Lý</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          </CardContent>
        </Card>

        {/* Card 4: Resolved */}
        <Card
          onClick={() => setActiveFilter("RESOLVED")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "RESOLVED"
              ? "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]"
              : "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đã Giải Quyết</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo nội dung, đối tượng bị báo cáo..."
              className="pl-9 h-10 rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Hiển thị <strong className="text-foreground">{filtered.length}</strong> hồ sơ báo cáo
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
              <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không có báo cáo vi phạm nào khớp bộ lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Tiêu Đề / Đối Tượng</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Nội Dung Chi Tiết</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mức Độ</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng Thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Xử Lý</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell>
                        <p className="font-bold text-sm text-foreground">{r.title || r.targetName || "Cảnh báo vi phạm"}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {r.id.slice(0, 8)}</p>
                      </TableCell>

                      <TableCell className="max-w-[300px]">
                        <p className="text-xs text-foreground font-medium line-clamp-2">{r.description || r.reason || "Phát hiện bất thường"}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Thời gian: {new Date(r.createdAt || Date.now()).toLocaleString("vi-VN")}
                        </p>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`font-extrabold text-[10px] ${
                            r.severity === "HIGH" || r.severity === "CRITICAL"
                              ? "bg-red-500/15 text-red-600 border-red-500/30"
                              : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                          }`}
                        >
                          {r.severity || "MEDIUM"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            r.status === "RESOLVED" || r.status === "CLOSED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {r.status === "RESOLVED" || r.status === "CLOSED" ? "Đã giải quyết" : "Chờ xử lý"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(r.status === "OPEN" || r.status === "PENDING") && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl h-8 text-xs font-bold gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: r.id,
                                    status: "RESOLVED",
                                    resolutionNote: "Admin đã xử lý và áp dụng biện pháp phòng ngừa",
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                Xử Lý Vi Phạm
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-xl h-8 text-xs text-muted-foreground hover:bg-muted"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: r.id,
                                    status: "CLOSED",
                                    resolutionNote: "Báo cáo không đủ bằng chứng vi phạm",
                                  })
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                Bỏ Qua
                              </Button>
                            </>
                          )}
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
    </div>
  );
}
