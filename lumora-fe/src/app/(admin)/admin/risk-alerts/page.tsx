"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShieldAlert, AlertTriangle, ShieldCheck, RefreshCw, Eye, CheckCircle2, XCircle, Search, Filter, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function RiskAlertsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("REVIEWING");

  // Query real Risk Alerts from Backend Risk Engine
  const { data: alertsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-risk-alerts", statusFilter, levelFilter],
    queryFn: async () => {
      const res = await api.get(`/admin/risk-alerts?status=${statusFilter}&level=${levelFilter}`);
      return res.data.success ? res.data.data : [];
    },
  });

  const alerts = Array.isArray(alertsData) ? alertsData : [];

  // Update Risk Alert Status Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note: string }) => {
      const res = await api.patch(`/admin/risk-alerts/${id}`, {
        status,
        adminNote: note,
        entityType: selectedAlert?.entityType,
        entityId: selectedAlert?.entityId,
        riskScore: selectedAlert?.riskScore,
        riskLevel: selectedAlert?.riskLevel,
        reasons: selectedAlert?.reasons,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật trạng thái xử lý rủi ro thành công!");
      setSelectedAlert(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-risk-alerts"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi xử lý rủi ro");
    },
  });

  const criticalCount = alerts.filter((a: any) => a.riskLevel === "CRITICAL").length;
  const highCount = alerts.filter((a: any) => a.riskLevel === "HIGH").length;
  const openCount = alerts.filter((a: any) => a.status === "OPEN").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <ShieldAlert className="h-7 w-7 text-red-500" /> Fraud / Risk Detection Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hệ thống phát hiện rủi ro Rule-Based — Đánh giá điểm Risk Score (0-100) cho Đơn hàng, Mã vé, Seller và Sự kiện.
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Tổng Số Cảnh Báo</p>
            <p className="text-2xl font-black text-foreground mt-1">{alerts.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-red-500/20 bg-red-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Mức Độ CRITICAL (80-100)</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{criticalCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Mức Độ HIGH (60-79)</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{highCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-500/20 bg-blue-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Cần Admin Xử Lý (OPEN)</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{openCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="OPEN">Mới phát hiện (OPEN)</SelectItem>
              <SelectItem value="REVIEWING">Đang điều tra (REVIEWING)</SelectItem>
              <SelectItem value="RESOLVED">Đã giải quyết (RESOLVED)</SelectItem>
              <SelectItem value="IGNORED">Bỏ qua (IGNORED)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl">
              <SelectValue placeholder="Mức độ rủi ro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả mức độ</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL (80 - 100)</SelectItem>
              <SelectItem value="HIGH">HIGH (60 - 79)</SelectItem>
              <SelectItem value="MEDIUM">MEDIUM (30 - 59)</SelectItem>
              <SelectItem value="LOW">LOW (0 - 29)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Risk Alert Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-3xl" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <Card className="rounded-3xl p-12 text-center text-muted-foreground border-border/50">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
            <p className="text-base font-bold text-foreground">Không phát hiện rủi ro bất thường nào</p>
            <p className="text-xs mt-1">Toàn bộ hệ thống giao dịch, mã vé và nhà tổ chức đang hoạt động an toàn.</p>
          </Card>
        ) : (
          alerts.map((alert: any) => {
            const isCritical = alert.riskLevel === "CRITICAL";
            const isHigh = alert.riskLevel === "HIGH";

            return (
              <Card
                key={alert.id}
                className={`rounded-3xl border shadow-xs overflow-hidden transition-shadow hover:shadow-md ${
                  isCritical
                    ? "border-red-500/30 bg-red-500/5"
                    : isHigh
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border/50 bg-card"
                }`}
              >
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`font-black text-xs px-2.5 py-0.5 rounded-lg ${
                          isCritical
                            ? "bg-red-600 text-white"
                            : isHigh
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        Risk Score: {alert.riskScore}/100 ({alert.riskLevel})
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">
                        Entity: {alert.entityType} #{alert.entityId}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold ${
                          alert.status === "OPEN"
                            ? "bg-blue-500/15 text-blue-600"
                            : alert.status === "RESOLVED"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-gray-500/15 text-gray-600"
                        }`}
                      >
                        {alert.status}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-base text-foreground truncate">{alert.entityName || `Cảnh báo rủi ro ${alert.entityType}`}</h3>

                    <div className="space-y-1">
                      {Array.isArray(alert.reasons) &&
                        alert.reasons.map((reason: string, rIdx: number) => (
                          <p key={rIdx} className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            {reason}
                          </p>
                        ))}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 text-xs font-bold gap-1.5 border-border/60"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setNewStatus(alert.status || "REVIEWING");
                        setAdminNote(alert.adminNote || "");
                      }}
                    >
                      <Eye className="h-4 w-4" /> Xem & Điều Tra
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Investigation Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" /> Điều Tra Cảnh Báo Rủi Ro (Risk Investigation)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Chi tiết điểm số rủi ro, phân tích nguyên nhân và quyết định xử lý từ Admin.
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Đối tượng (Entity): {selectedAlert.entityType}</span>
                  <Badge className="bg-red-600 text-white font-extrabold">Score: {selectedAlert.riskScore}/100</Badge>
                </div>
                <p>Entity ID: <span className="font-mono">{selectedAlert.entityId}</span></p>
                <p>Mức độ rủi ro: <span className="font-bold text-red-500">{selectedAlert.riskLevel}</span></p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-foreground">Lý do hệ thống cảnh báo (Risk Factors):</p>
                <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/20 space-y-1">
                  {Array.isArray(selectedAlert.reasons) &&
                    selectedAlert.reasons.map((r: string, idx: number) => (
                      <p key={idx} className="font-semibold text-red-700 dark:text-red-400">
                        • {r}
                      </p>
                    ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Chọn trạng thái xử lý mới:</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVIEWING">REVIEWING — Đang tiến hành điều tra</SelectItem>
                    <SelectItem value="RESOLVED">RESOLVED — Đã xử lý / Khắc phục xong</SelectItem>
                    <SelectItem value="IGNORED">IGNORED — Bỏ qua (Đã xác minh an toàn)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Ghi chú xử lý của Admin (Admin Note):</label>
                <Textarea
                  placeholder="Nhập nội dung ghi chú kết quả điều tra..."
                  className="rounded-xl min-h-[80px]"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setSelectedAlert(null)}>
                  Đóng
                </Button>
                <Button
                  className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() =>
                    updateMutation.mutate({
                      id: selectedAlert.id,
                      status: newStatus,
                      note: adminNote,
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  Xác Nhận Lưu Kết Quả
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
