"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Shield, Plus, Key, UserCog, Trash2, Edit2, RefreshCw, CheckCircle2, Ban, ShieldCheck, History, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("ADMIN");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  // 1. Fetch real Admin & Staff users from Backend API
  const { data: usersData, isLoading: isLoadingUsers, refetch, isFetching } = useQuery({
    queryKey: ["admin-staff-users", search],
    queryFn: async () => {
      const res = await api.get(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      return res.data.success ? res.data.data : [];
    },
  });

  // 2. Fetch real Audit Logs from Backend API
  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const res = await api.get("/admin/logs");
      return res.data.success ? res.data.data : [];
    },
  });

  const users = Array.isArray(usersData) ? usersData : [];
  const staffUsers = users.filter((u: any) => u.role === "ADMIN");
  const auditLogs = Array.isArray(logsData) ? logsData : [];

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.patch(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật vai trò tài khoản thành công!");
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-staff-users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi phân quyền tài khoản");
    },
  });

  // Toggle Block Mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/admin/users/${userId}/block`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật trạng thái tài khoản thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-staff-users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi khóa tài khoản");
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã xóa tài khoản thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-staff-users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi xóa tài khoản");
    },
  });

  const handleDelete = (userId: string, email: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản nhân viên ${email} không?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <ShieldCheck className="h-7 w-7 text-primary" /> Quản Trị & Phân Quyền Hệ Thống
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tài khoản Admin/Nhân viên, gán vai trò truy cập và kiểm soát nhật ký Audit Log hệ thống.
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

      {/* Real Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Tổng Người Dùng Sàn</p>
            <p className="text-2xl font-black text-foreground mt-1">{users.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-primary uppercase">Quản Trị Viên (Admin)</p>
            <p className="text-2xl font-black text-primary mt-1">{staffUsers.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-purple-500/20 bg-purple-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Nhà Tổ Chức (Seller)</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {users.filter((u: any) => u.role === "SELLER").length}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Bản Ghi Audit Log</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{auditLogs.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="rounded-2xl p-1 bg-muted/40 border border-border/50">
          <TabsTrigger value="staff" className="rounded-xl text-xs font-bold px-4">
            Danh Sách Quản Trị Viên ({staffUsers.length})
          </TabsTrigger>
          <TabsTrigger value="all-users" className="rounded-xl text-xs font-bold px-4">
            Tất Cả Tài Khoản ({users.length})
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl text-xs font-bold px-4">
            Nhật Ký Audit Log ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Staff Administrators */}
        <TabsContent value="staff" className="mt-4">
          <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" /> Đội Ngũ Quản Trị Viên (Role Admin)
                  </CardTitle>
                  <CardDescription>Các tài khoản được quyền truy cập vào các module Admin toàn hệ thống.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {isLoadingUsers ? (
                <div className="p-6 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : staffUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-base font-bold text-foreground">Chưa có tài khoản Admin nào khác</p>
                  <p className="text-xs mt-1">Chuyển sang tab &quot;Tất Cả Tài Khoản&quot; để gán quyền Admin cho người dùng.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Quản Trị Viên</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Vai trò (Role)</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Ngày khởi tạo</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Phân quyền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffUsers.map((s: any) => (
                        <TableRow key={s.id} className="hover:bg-muted/20">
                          <TableCell>
                            <p className="font-bold text-sm text-foreground">{s.name || s.username || "Admin"}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </TableCell>

                          <TableCell>
                            <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-extrabold">
                              ADMIN
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                !s.isBlocked
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                              }`}
                            >
                              {!s.isBlocked ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl h-8 text-xs font-bold gap-1 border-primary/40 text-primary"
                                onClick={() => {
                                  setSelectedUser(s);
                                  setNewRole(s.role);
                                  setIsRoleDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Đổi Role
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-xl ${s.isBlocked ? "text-emerald-600" : "text-red-500"}`}
                                title={s.isBlocked ? "Mở khóa" : "Khóa"}
                                onClick={() => toggleBlockMutation.mutate(s.id)}
                              >
                                {s.isBlocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </Button>
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
        </TabsContent>

        {/* TAB 2: All Users & Role Assignment */}
        <TabsContent value="all-users" className="mt-4">
          <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Phân Quyền Tất Cả Người Dùng Trong CSDL
                  </CardTitle>
                  <CardDescription>Chọn người dùng bất kỳ để nâng cấp thành Quản Trị Viên (Admin) hoặc Nhà Tổ Chức (Seller).</CardDescription>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm tên, email..."
                    className="pl-9 h-9 rounded-xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="overflow-x-auto rounded-2xl border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Họ Tên / Email</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Vai trò hiện tại</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Phân Quyền Thao Tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u.id} className="hover:bg-muted/20">
                        <TableCell>
                          <p className="font-bold text-sm text-foreground">{u.name || u.email}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="font-bold">
                            {u.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              !u.isBlocked ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {!u.isBlocked ? "Hoạt động" : "Đã khóa"}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl h-8 text-xs font-bold gap-1 border-primary/40 text-primary"
                              onClick={() => {
                                setSelectedUser(u);
                                setNewRole(u.role);
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <UserCog className="h-3.5 w-3.5" /> Gán Vai Trò
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Audit Logs */}
        <TabsContent value="logs" className="mt-4">
          <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Nhật Ký Hoạt Động Audit Log
              </CardTitle>
              <CardDescription>Ghi vết tất cả hành động quản trị nhạy cảm (Override Check-in, Phê duyệt Hoàn tiền, Rút tiền, Phân quyền).</CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              {isLoadingLogs ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-base font-bold text-foreground">Chưa có nhật ký Audit Log nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Thời gian</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Admin thực hiện</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Hành động (Action)</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Chi tiết nội dung</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log: any) => (
                        <TableRow key={log.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {new Date(log.createdAt).toLocaleString("vi-VN")}
                          </TableCell>

                          <TableCell className="font-bold text-xs">
                            {log.admin?.name || log.admin?.email || "System Admin"}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="font-mono font-bold text-[11px] text-primary border-primary/30">
                              {log.action}
                            </Badge>
                          </TableCell>

                          <TableCell className="max-w-[300px]">
                            <p className="text-xs font-mono text-muted-foreground truncate" title={log.details}>
                              {log.details}
                            </p>
                          </TableCell>

                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {log.ipAddress || "Internal"}
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

        {/* Change Role Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="font-bold text-lg flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" /> Phân Quyền Tài Khoản
              </DialogTitle>
              <DialogDescription className="text-xs">
                Thay đổi vai trò để cấp quyền truy cập vào các module hệ thống.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-2 text-xs">
                <div className="p-3 bg-muted/40 rounded-xl space-y-1 border">
                  <p>Tài khoản: <span className="font-bold text-foreground">{selectedUser.name || selectedUser.email}</span></p>
                  <p>Email: <span className="font-mono">{selectedUser.email}</span></p>
                  <p>Vai trò hiện tại: <span className="font-bold text-primary">{selectedUser.role}</span></p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Chọn vai trò mới (Role)</label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Quản Trị Viên (ADMIN) - Toàn quyền hệ thống</SelectItem>
                      <SelectItem value="SELLER">Nhà Tổ Chức (SELLER) - Tạo sự kiện & bán vé</SelectItem>
                      <SelectItem value="BUYER">Khách Mua Vé (BUYER) - Khách hàng thông thường</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIsRoleDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() =>
                  selectedUser &&
                  updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole })
                }
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? "Đang lưu..." : "Xác Nhận Lưu Phân Quyền"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
