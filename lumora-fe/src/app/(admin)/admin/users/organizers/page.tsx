"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Building2, Search, CheckCircle2, XCircle, Eye, FileText, Ban, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function OrganizersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch real Organizers data from Backend API
  const { data: organizersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-organizers", search, statusFilter],
    queryFn: async () => {
      const res = await api.get(`/admin/organizers?status=${statusFilter}&search=${encodeURIComponent(search)}`);
      return res.data.success ? res.data.data : [];
    },
  });

  const organizers = Array.isArray(organizersData) ? organizersData : [];

  // Approve Organizer Application Mutation
  const approveMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const res = await api.patch(`/admin/organizer-applications/${profileId}/approve`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã duyệt đơn đăng ký nhà tổ chức thành công!");
      setSelectedOrg(null);
      queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi duyệt nhà tổ chức";
      toast.error(msg);
    },
  });

  // Reject Organizer Application Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ profileId, reason }: { profileId: string; reason: string }) => {
      const res = await api.patch(`/admin/organizer-applications/${profileId}/reject`, { reason });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã từ chối đơn đăng ký nhà tổ chức.");
      setIsRejectDialogOpen(false);
      setSelectedOrg(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi từ chối nhà tổ chức";
      toast.error(msg);
    },
  });

  // Toggle User Block Mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/admin/users/${userId}/block`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật trạng thái tài khoản thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi thay đổi trạng thái tài khoản");
    },
  });

  const filteredOrganizers = organizers.filter((org: any) => {
    const matchSearch =
      !search ||
      org.name?.toLowerCase().includes(search.toLowerCase()) ||
      org.email?.toLowerCase().includes(search.toLowerCase()) ||
      org.businessLicense?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || org.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCount = organizers.length;
  const approvedCount = organizers.filter((o: any) => o.status === "APPROVED" || o.status === "VERIFIED").length;
  const pendingCount = organizers.filter((o: any) => o.status === "PENDING").length;
  const totalRevenue = organizers.reduce((sum: number, o: any) => sum + Number(o.revenue || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Building2 className="h-7 w-7 text-primary" /> Quản Lý Nhà Tổ Chức (Organizer)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Duyệt đơn đăng ký doanh nghiệp, kiểm tra giấy phép kinh doanh và quản lý trạng thái hoạt động của Seller.
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

      {/* Overview Real Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Tổng Số Nhà Tổ Chức</p>
            <p className="text-2xl font-black text-foreground mt-1">{totalCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Đã Duyệt Hoạt Động</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Đơn Hồ Sơ Chờ Duyệt</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-primary font-semibold uppercase">Doanh Thu Tích Lũy NTC</p>
            <p className="text-xl font-black text-primary mt-1">
              {totalRevenue.toLocaleString("vi-VN")} ₫
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Tên tổ chức, Email liên hệ, Mã ĐKKD..."
              className="pl-9 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizers Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredOrganizers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không tìm thấy Nhà tổ chức nào</p>
              <p className="text-xs mt-1">Dữ liệu Nhà tổ chức thực tế từ CSDL đang trống hoặc không khớp từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Tên Tổ Chức</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Mã ĐKKD</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Sự Kiện Đã Tạo</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right hidden lg:table-cell">Doanh Thu</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng Thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao Tác Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizers.map((org: any) => (
                    <TableRow key={org.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600 font-bold text-sm">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{org.name}</p>
                            <p className="text-xs text-muted-foreground">{org.email} · {org.phone}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <p className="text-xs font-mono font-semibold">{org.businessLicense}</p>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs font-bold text-foreground">{org.eventsCount} sự kiện</span>
                      </TableCell>

                      <TableCell className="text-right hidden lg:table-cell">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {Number(org.revenue || 0).toLocaleString("vi-VN")} ₫
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {org.status === "APPROVED" || org.status === "VERIFIED" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 w-fit">
                              ✓ Đã duyệt
                            </Badge>
                          ) : org.status === "REJECTED" ? (
                            <Badge variant="destructive" className="w-fit">Từ chối</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 w-fit">
                              Chờ duyệt hồ sơ
                            </Badge>
                          )}
                          {org.isBlocked && (
                            <Badge variant="outline" className="text-red-500 border-red-500/30 w-fit">
                              Khóa tài khoản
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-xl"
                            onClick={() => setSelectedOrg(org)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {org.status === "PENDING" && (
                            <Button
                              size="sm"
                              className="h-8 text-xs px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                              onClick={() => approveMutation.mutate(org.id)}
                              disabled={approveMutation.isPending}
                            >
                              Duyệt
                            </Button>
                          )}

                          {org.userId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 rounded-xl ${org.isBlocked ? "text-emerald-600" : "text-red-500"}`}
                              title={org.isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                              onClick={() => toggleBlockMutation.mutate(org.userId)}
                            >
                              {org.isBlocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            </Button>
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

      {/* Details Dialog */}
      <Dialog open={!!selectedOrg && !isRejectDialogOpen} onOpenChange={(open) => !open && setSelectedOrg(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Hồ Sơ Chi Tiết Nhà Tổ Chức
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thông tin chi tiết tài khoản Seller và hồ sơ pháp lý doanh nghiệp.
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-2.5 rounded-xl border">
                  <p className="text-muted-foreground font-semibold">Tên Tổ Chức</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedOrg.name}</p>
                </div>

                <div className="bg-muted/30 p-2.5 rounded-xl border">
                  <p className="text-muted-foreground font-semibold">Email Liên Hệ</p>
                  <p className="font-bold text-foreground mt-0.5 truncate">{selectedOrg.email}</p>
                </div>

                <div className="bg-muted/30 p-2.5 rounded-xl border">
                  <p className="text-muted-foreground font-semibold">Số Điện Thoại</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedOrg.phone}</p>
                </div>

                <div className="bg-muted/30 p-2.5 rounded-xl border">
                  <p className="text-muted-foreground font-semibold">Mã ĐKKD / MST</p>
                  <p className="font-mono font-bold text-foreground mt-0.5">{selectedOrg.businessLicense}</p>
                </div>
              </div>

              {selectedOrg.documentUrl && (
                <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between border border-primary/10">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-bold text-foreground">Giấy phép đăng ký kinh doanh</p>
                      <p className="text-[10px] text-muted-foreground">File tài liệu pháp lý đã tải lên</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs font-bold" onClick={() => window.open(selectedOrg.documentUrl, "_blank")}>
                    Xem file PDF
                  </Button>
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" className="rounded-xl text-xs" onClick={() => setSelectedOrg(null)}>
                  Đóng
                </Button>
                {selectedOrg.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl text-xs text-red-500 border-red-500/30"
                      onClick={() => setIsRejectDialogOpen(true)}
                    >
                      Từ chối
                    </Button>
                    <Button
                      className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => approveMutation.mutate(selectedOrg.id)}
                      disabled={approveMutation.isPending}
                    >
                      Xác Minh & Duyệt
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Từ Chối Đơn Đăng Ký Nhà Tổ Chức
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vui lòng nhập lý do từ chối để phản hồi đến người nộp đơn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <Textarea
              placeholder="Nhập lý do từ chối (ví dụ: Giấy phép ĐKKD không khớp thông tin, ảnh chụp bị mờ)..."
              className="rounded-xl min-h-[90px]"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIsRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                selectedOrg &&
                rejectMutation.mutate({ profileId: selectedOrg.id, reason: rejectReason })
              }
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              Xác Nhận Từ Chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
