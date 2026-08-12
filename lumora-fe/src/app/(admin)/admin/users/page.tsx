"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Users, Search, Ban, CheckCircle2,
  Trash2, Eye, Shield, RefreshCw, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  BUYER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SELLER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Khách hàng",
  SELLER: "Nhà tổ chức",
  ADMIN: "Quản trị viên",
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Query real users from Backend API
  const { data: usersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-users-list", search, roleFilter],
    queryFn: async () => {
      const queryRole = roleFilter !== "ALL" ? `?role=${roleFilter}` : "";
      const querySearch = search ? `${queryRole ? "&" : "?"}search=${encodeURIComponent(search)}` : "";
      const res = await api.get(`/admin/users${queryRole}${querySearch}`);
      return res.data.success ? res.data.data : [];
    },
  });

  const users = Array.isArray(usersData) ? usersData : [];

  // Toggle Block Mutation
  const toggleBlockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/admin/users/${userId}/block`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật trạng thái tài khoản thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi cập nhật trạng thái");
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã xóa tài khoản.");
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi xóa tài khoản");
    },
  });

  const handleDelete = (userId: string, email: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản ${email} không?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const filtered = users.filter((u: any) => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || (statusFilter === "BLOCKED" ? u.isBlocked : !u.isBlocked);
    return matchSearch && matchRole && matchStatus;
  });

  const buyerCount = users.filter((u: any) => u.role === "BUYER").length;
  const sellerCount = users.filter((u: any) => u.role === "SELLER").length;
  const blockedCount = users.filter((u: any) => u.isBlocked).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Users className="h-7 w-7 text-primary" /> Quản Lý Tất Cả Tài Khoản
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi, phân quyền và kiểm soát hoạt động của toàn bộ thành viên trên sàn Lumora.
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Tổng Người Dùng</p>
            <p className="text-2xl font-black text-foreground mt-1">{users.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-500/20 bg-blue-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Khách Hàng (Buyer)</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{buyerCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-purple-500/20 bg-purple-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Nhà Tổ Chức (Seller)</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{sellerCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-red-500/20 bg-red-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Tài Khoản Khóa</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{blockedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Tên, Email, Username..."
              className="pl-9 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              <SelectItem value="BUYER">Khách hàng (BUYER)</SelectItem>
              <SelectItem value="SELLER">Nhà tổ chức (SELLER)</SelectItem>
              <SelectItem value="ADMIN">Quản trị viên (ADMIN)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="BLOCKED">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
          {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-xl gap-1.5"
              onClick={() => {
                setSearch("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
            >
              <X className="h-3.5 w-3.5" /> Xóa lọc
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không tìm thấy người dùng nào</p>
              <p className="text-xs mt-1">Dữ liệu thành viên trong CSDL đang trống hoặc không khớp bộ lọc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Người Dùng</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Vai Trò</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Ngày Tạo</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng Thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user: any) => (
                    <TableRow key={user.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                              {(user.name || user.email || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm truncate text-foreground">{user.name || "Khách hàng"}</p>
                              {user.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={`font-extrabold text-xs ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            user.isBlocked
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}
                        >
                          {user.isBlocked ? "Đã khóa" : "Hoạt động"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-xl"
                            onClick={() => setSelectedUser(user)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 rounded-xl ${
                              user.isBlocked ? "text-emerald-600" : "text-orange-500"
                            }`}
                            onClick={() => toggleBlockMutation.mutate(user.id)}
                            title={user.isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                          >
                            {user.isBlocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-xl text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(user.id, user.email)}
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Chi Tiết Tài Khoản Thành Viên</DialogTitle>
            <DialogDescription className="text-xs">
              Thông tin người dùng được trích xuất trực tiếp từ CSDL.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border">
                <div>
                  <p className="text-muted-foreground font-semibold">Họ Tên</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedUser.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Email</p>
                  <p className="font-bold text-foreground mt-0.5 truncate">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Vai Trò</p>
                  <p className="font-bold text-primary mt-0.5">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Ngày Tạo</p>
                  <p className="font-bold text-foreground mt-0.5">
                    {new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
