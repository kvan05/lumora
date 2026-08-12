"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { DollarSign, ArrowUpRight, CheckCircle2, XCircle, RefreshCw, Wallet, Clock, Building2, CreditCard, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AdminFinancePage() {
  const queryClient = useQueryClient();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionType, setActionType] = useState<"COMPLETED" | "REJECTED">("COMPLETED");

  // Fetch real financial stats from Backend API
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/finance/stats");
      return res.data.success ? res.data.data : null;
    },
  });

  // Fetch withdrawal requests from Backend API
  const { data: withdrawalsData, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const res = await api.get("/admin/withdrawals");
      return res.data.success ? res.data.data : [];
    },
  });

  // Fetch settlements from Backend API
  const { data: settlementsData, isLoading: isLoadingSettlements } = useQuery({
    queryKey: ["admin-settlements"],
    queryFn: async () => {
      const res = await api.get("/admin/settlements");
      return res.data.success ? res.data.data : [];
    },
  });

  const stats = statsData || {
    gmv: 0,
    platformFee: 0,
    sellerRevenue: 0,
    totalPaidOut: 0,
    pendingPayout: 0,
    totalRefunded: 0,
    pendingWithdrawalsCount: 0,
    netRevenue: 0,
  };

  const withdrawals = Array.isArray(withdrawalsData) ? withdrawalsData : [];
  const settlements = Array.isArray(settlementsData) ? settlementsData : [];

  // Process Withdrawal Mutation
  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) => {
      const res = await api.patch(`/admin/withdrawals/${id}`, { status, adminNote });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã cập nhật trạng thái rút tiền thành công!");
      setSelectedWithdrawal(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance-stats"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi xử lý rút tiền";
      toast.error(msg);
    },
  });

  const handleOpenActionModal = (withdrawal: any, type: "COMPLETED" | "REJECTED") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setAdminNote("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Wallet className="h-7 w-7 text-primary" /> Quản Lý Tài Chính & Rút Tiền
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi tổng doanh thu sàn (GMV), phí dịch vụ 5%, kiểm soát chi trả Seller và duyệt lệnh rút tiền.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold gap-2 border-border/60 self-start sm:self-auto"
          onClick={() => refetchStats()}
        >
          <RefreshCw className="h-4 w-4" /> Làm mới
        </Button>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Tổng Doanh Thu Sàn (GMV)</p>
            <p className="text-2xl font-black text-foreground mt-1">
              {Number(stats.gmv || 0).toLocaleString("vi-VN")} ₫
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-primary uppercase">Phí Dịch Vụ Sàn (5%)</p>
            <p className="text-2xl font-black text-primary mt-1">
              {Number(stats.platformFee || 0).toLocaleString("vi-VN")} ₫
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Đã Chi Trả Cho Seller</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {Number(stats.totalPaidOut || 0).toLocaleString("vi-VN")} ₫
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Rút Tiền Đang Chờ Duyệt</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {Number(stats.pendingPayout || 0).toLocaleString("vi-VN")} ₫
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="withdrawals" className="w-full">
        <TabsList className="rounded-2xl p-1 bg-muted/40 border border-border/50">
          <TabsTrigger value="withdrawals" className="rounded-xl text-xs font-bold px-4">
            Yêu Cầu Rút Tiền ({withdrawals.filter((w: any) => w.status === "PENDING").length})
          </TabsTrigger>
          <TabsTrigger value="settlements" className="rounded-xl text-xs font-bold px-4">
            Bảng Quyết Toán Doanh Thu ({settlements.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Withdrawal Requests */}
        <TabsContent value="withdrawals" className="mt-4">
          <Card className="rounded-3xl border-border/50 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Yêu Cầu Rút Tiền Của Nhà Tổ Chức (Seller)
              </CardTitle>
              <CardDescription>
                Duyệt chuyển khoản tiền doanh thu đã đối soát từ tài khoản sàn về tài khoản ngân hàng Seller.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              {isLoadingWithdrawals ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-base font-bold text-foreground">Chưa có yêu cầu rút tiền nào</p>
                  <p className="text-xs mt-1">Các yêu cầu từ Seller sẽ xuất hiện ở đây.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Seller (Nhà Tổ Chức)</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Số tiền rút</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Thông tin Ngân hàng</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Ngày yêu cầu</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao tác Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((w: any) => (
                        <TableRow key={w.id} className="hover:bg-muted/20">
                          <TableCell>
                            <p className="font-bold text-sm">{w.seller?.name || "Seller"}</p>
                            <p className="text-xs text-muted-foreground">{w.seller?.email}</p>
                          </TableCell>

                          <TableCell className="text-right font-black text-sm text-primary">
                            {Number(w.amount).toLocaleString("vi-VN")} ₫
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{w.bankName}</span>
                            </div>
                            <p className="text-xs font-mono text-foreground font-bold mt-0.5">{w.accountNumber}</p>
                            <p className="text-[11px] text-muted-foreground uppercase">{w.accountHolder}</p>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(w.createdAt).toLocaleDateString("vi-VN")}
                          </TableCell>

                          <TableCell>
                            {w.status === "COMPLETED" ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                                ✓ Đã chuyển tiền
                              </Badge>
                            ) : w.status === "REJECTED" ? (
                              <Badge variant="destructive">Từ chối</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                Chờ duyệt
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            {w.status === "PENDING" && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="rounded-xl h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  onClick={() => handleOpenActionModal(w, "COMPLETED")}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt Chuyển
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl h-8 text-xs font-bold border-red-500/30 text-red-500 hover:bg-red-500/10 gap-1"
                                  onClick={() => handleOpenActionModal(w, "REJECTED")}
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
        </TabsContent>

        {/* TAB 2: Settlements */}
        <TabsContent value="settlements" className="mt-4">
          <Card className="rounded-3xl border-border/50 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Bảng Đối Soát Doanh Thu Sự Kiện (Settlements)
              </CardTitle>
              <CardDescription>
                Hệ thống tự động tính toán tổng doanh thu vé bán, khấu trừ 5% hoa hồng sàn và xác định số tiền thực nhận của Seller.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              {isLoadingSettlements ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : settlements.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-base font-bold text-foreground">Chưa có bản ghi đối soát nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Sự kiện</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Seller</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Tổng GMV</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Phí sàn (5%)</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thực nhận (95%)</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settlements.map((s: any) => (
                        <TableRow key={s.id} className="hover:bg-muted/20">
                          <TableCell className="font-bold text-sm">{s.event?.title || "Sự kiện"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.event?.seller?.name || s.event?.seller?.email}</TableCell>
                          <TableCell className="text-right font-extrabold text-sm">{Number(s.grossRevenue).toLocaleString("vi-VN")} ₫</TableCell>
                          <TableCell className="text-right text-xs font-bold text-primary">{Number(s.commissionFee).toLocaleString("vi-VN")} ₫</TableCell>
                          <TableCell className="text-right font-black text-sm text-emerald-600 dark:text-emerald-400">{Number(s.netAmount).toLocaleString("vi-VN")} ₫</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                              {s.status}
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
        </TabsContent>
      </Tabs>

      {/* Confirmation Action Modal */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={(open) => !open && setSelectedWithdrawal(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionType === "COMPLETED" ? "text-emerald-600" : "text-destructive"}`}>
              {actionType === "COMPLETED" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {actionType === "COMPLETED" ? "Duyệt Lệnh Chuyển Tiền" : "Từ Chối Rút Tiền"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thao tác này sẽ cập nhật trạng thái lệnh rút tiền trong CSDL và tạo bản ghi Audit Log.
            </DialogDescription>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1.5 border border-border/50">
                <p>Seller: <span className="font-bold text-foreground">{selectedWithdrawal.seller?.name || selectedWithdrawal.seller?.email}</span></p>
                <p>Số tiền rút: <span className="font-black text-sm text-primary">{Number(selectedWithdrawal.amount).toLocaleString("vi-VN")} ₫</span></p>
                <p>Ngân hàng: <span className="font-bold">{selectedWithdrawal.bankName}</span> — STK: <span className="font-mono font-bold">{selectedWithdrawal.accountNumber}</span></p>
                <p>Chủ TK: <span className="font-bold uppercase">{selectedWithdrawal.accountHolder}</span></p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Ghi chú quản trị viên (Admin Note)</label>
                <Textarea
                  placeholder="Nhập ghi chú hoặc mã giao dịch ngân hàng đối soát..."
                  className="rounded-xl text-xs min-h-[80px]"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => setSelectedWithdrawal(null)}>
              Hủy bỏ
            </Button>
            <Button
              className={`rounded-xl text-xs font-bold ${actionType === "COMPLETED" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive text-white"}`}
              onClick={() =>
                selectedWithdrawal &&
                processWithdrawalMutation.mutate({
                  id: selectedWithdrawal.id,
                  status: actionType,
                  adminNote,
                })
              }
              disabled={processWithdrawalMutation.isPending}
            >
              {processWithdrawalMutation.isPending ? "Đang xử lý..." : actionType === "COMPLETED" ? "Xác Nhận Đã Chuyển Tiền" : "Xác Nhận Từ Chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
