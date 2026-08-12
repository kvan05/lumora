"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RefreshCw, Search, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, FileText, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminRefundsAndComplaintsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [adminNote, setAdminNote] = useState("");

  // Fetch real Refund Requests & Reports from Backend API
  const { data: refundsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: async () => {
      const res = await api.get("/admin/refunds");
      return res.data.success ? res.data.data : { refundRequests: [], reports: [] };
    },
  });

  const refundRequests = Array.isArray(refundsData?.refundRequests) ? refundsData.refundRequests : [];
  const reports = Array.isArray(refundsData?.reports) ? refundsData.reports : [];

  // Approve Refund Mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, adminNote }: { id: string; adminNote: string }) => {
      const res = await api.post(`/admin/refunds/${id}/approve`, { adminNote });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã chấp nhận hoàn tiền và khóa mã vé thành công!");
      setSelectedRefund(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi xử lý hoàn tiền";
      toast.error(msg);
    },
  });

  // Reject Refund Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminNote }: { id: string; adminNote: string }) => {
      const res = await api.post(`/admin/refunds/${id}/reject`, { adminNote });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã từ chối yêu cầu hoàn tiền.");
      setSelectedRefund(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi từ chối hoàn tiền";
      toast.error(msg);
    },
  });

  const filteredRequests = refundRequests.filter((r: any) => {
    const buyerName = r.user?.name || r.user?.email || r.order?.buyer?.name || "";
    const eventTitle = r.order?.event?.title || "";
    const orderNumber = r.order?.orderNumber || "";

    const matchSearch =
      !search ||
      orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      buyerName.toLowerCase().includes(search.toLowerCase()) ||
      eventTitle.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = refundRequests.filter((r: any) => r.status === "PENDING").length;
  const totalApproved = refundRequests.filter((r: any) => r.status === "APPROVED").length;
  const totalRejected = refundRequests.filter((r: any) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <ShieldAlert className="h-7 w-7 text-primary" /> Khiếu Nại & Xử Lý Hoàn Tiền
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tiếp nhận khiếu nại, xem xét lý do hoàn tiền, phê duyệt trả lại tiền qua PayOS và tự động khóa mã vé Barcode.
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

      {/* Real Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Tổng Yêu Cầu Hoàn Tiền</p>
            <p className="text-2xl font-black text-foreground mt-1">{refundRequests.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Chờ Xử Lý</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalPending}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Đã Chấp Nhận Hoàn</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalApproved}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-red-500/20 bg-red-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Đã Từ Chối</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{totalRejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo Mã đơn hàng, Tên người mua, Tên sự kiện..."
              className="pl-9 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
              <SelectValue placeholder="Trạng thái xử lý" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả yêu cầu</SelectItem>
              <SelectItem value="PENDING">Chờ xử lý (PENDING)</SelectItem>
              <SelectItem value="APPROVED">Đã hoàn tiền (APPROVED)</SelectItem>
              <SelectItem value="REJECTED">Từ chối (REJECTED)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Refund Requests Data Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Danh Sách Yêu Cầu Hoàn Tiền & Khiếu Nại
          </CardTitle>
          <CardDescription>
            Xem xét chi tiết lý do khiếu nại, xác minh đơn hàng và đưa ra quyết định xử lý.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không có yêu cầu hoàn tiền nào</p>
              <p className="text-xs mt-1">Các khiếu nại hoàn tiền thực tế sẽ tự động hiển thị ở đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Mã đơn hàng</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Khách hàng (Buyer)</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Ban tổ chức (Seller)</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Lý do khiếu nại</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Số tiền đề nghị</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao tác Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((r: any) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {r.order?.orderNumber || "ORD-x"}
                        <p className="text-[10px] text-muted-foreground font-normal">
                          {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-bold text-sm">{r.user?.name || r.order?.buyer?.name || "Khách hàng"}</p>
                        <p className="text-xs text-muted-foreground">{r.user?.email || r.order?.buyer?.email}</p>
                      </TableCell>

                      <TableCell className="max-w-[160px]">
                        <p className="font-semibold text-xs truncate">{r.order?.event?.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.order?.event?.seller?.name || r.order?.event?.seller?.email}</p>
                      </TableCell>

                      <TableCell className="max-w-[200px]">
                        <p className="text-xs font-medium text-foreground line-clamp-2">{r.reason}</p>
                      </TableCell>

                      <TableCell className="text-right font-black text-sm text-primary">
                        {Number(r.amount).toLocaleString("vi-VN")} ₫
                      </TableCell>

                      <TableCell>
                        {r.status === "APPROVED" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            ✓ Đã hoàn tiền
                          </Badge>
                        ) : r.status === "REJECTED" ? (
                          <Badge variant="destructive">Từ chối hoàn</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Chờ xử lý
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {r.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="rounded-xl h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              onClick={() => {
                                setSelectedRefund(r);
                                setActionType("APPROVE");
                                setAdminNote("");
                              }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt Hoàn
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl h-8 text-xs font-bold border-red-500/30 text-red-500 hover:bg-red-500/10 gap-1"
                              onClick={() => {
                                setSelectedRefund(r);
                                setActionType("REJECT");
                                setAdminNote("");
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Từ Chối
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedRefund} onOpenChange={(open) => !open && setSelectedRefund(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionType === "APPROVE" ? "text-emerald-600" : "text-destructive"}`}>
              {actionType === "APPROVE" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {actionType === "APPROVE" ? "Phê Duyệt Hoàn Tiền" : "Từ Chối Yêu Cầu Hoàn Tiền"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thao tác này sẽ khóa tất cả vé thuộc đơn hàng này, cập nhật doanh thu Seller và tạo bản ghi Audit Log.
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 border border-border/50">
                <p>Mã đơn hàng: <span className="font-mono font-bold text-primary">{selectedRefund.order?.orderNumber}</span></p>
                <p>Khách hàng: <span className="font-bold">{selectedRefund.user?.name || selectedRefund.user?.email}</span></p>
                <p>Sự kiện: <span className="font-semibold">{selectedRefund.order?.event?.title}</span></p>
                <p>Số tiền hoàn: <span className="font-black text-sm text-primary">{Number(selectedRefund.amount).toLocaleString("vi-VN")} ₫</span></p>
                <p>Lý do từ khách hàng: <span className="italic text-muted-foreground">{selectedRefund.reason}</span></p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Ghi chú Admin {actionType === "REJECT" ? "(Bắt buộc nhập lý do từ chối) *" : "(Không bắt buộc)"}
                </label>
                <Textarea
                  placeholder={actionType === "REJECT" ? "Vui lòng nhập lý do từ chối hoàn tiền..." : "Nhập ghi chú phản hồi cho khách hàng..."}
                  className="rounded-xl text-xs min-h-[80px]"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => setSelectedRefund(null)}>
              Hủy bỏ
            </Button>
            <Button
              className={`rounded-xl text-xs font-bold ${actionType === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive text-white"}`}
              onClick={() => {
                if (actionType === "APPROVE") {
                  approveMutation.mutate({ id: selectedRefund.id, adminNote });
                } else {
                  rejectMutation.mutate({ id: selectedRefund.id, adminNote });
                }
              }}
              disabled={approveMutation.isPending || rejectMutation.isPending || (actionType === "REJECT" && !adminNote.trim())}
            >
              {approveMutation.isPending || rejectMutation.isPending ? "Đang xử lý..." : actionType === "APPROVE" ? "Xác Nhận Duyệt Hoàn Tiền" : "Xác Nhận Từ Chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
