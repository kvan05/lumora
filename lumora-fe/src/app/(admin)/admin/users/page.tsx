"use client";

import { useState, useEffect } from "react";
import {
  Users, Search, Filter, MoreHorizontal, Ban, CheckCircle, CheckCircle2,
  Trash2, Eye, UserCheck, Shield, ShoppingBag, CreditCard,
  MessageSquare, RefreshCw, Download, SlidersHorizontal, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/api";

const MOCK_USERS = [
  { id: "u1", name: "Nguyễn Văn An", username: "vanan", email: "vanan@gmail.com", role: "BUYER", isVerified: true, isBlocked: false, createdAt: "2026-01-15", orders: 12, totalSpent: 8400000, avatar: null },
  { id: "u2", name: "Trần Thị Bích", username: "tbich", email: "tbich@gmail.com", role: "BUYER", isVerified: true, isBlocked: false, createdAt: "2026-02-20", orders: 5, totalSpent: 3200000, avatar: null },
  { id: "u3", name: "Lê Minh Cường", username: "mcuong", email: "mcuong@outlook.com", role: "BUYER", isVerified: true, isBlocked: true, createdAt: "2026-03-10", orders: 2, totalSpent: 1500000, avatar: null },
  { id: "u4", name: "Phạm Thị Dung", username: "tdung99", email: "tdung99@yahoo.com", role: "BUYER", isVerified: false, isBlocked: false, createdAt: "2026-04-05", orders: 0, totalSpent: 0, avatar: null },
  { id: "u5", name: "Vũ Hoàng Gia", username: "hgia_dev", email: "hgia@company.vn", role: "SELLER", isVerified: true, isBlocked: false, createdAt: "2025-12-01", orders: 0, totalSpent: 0, avatar: null },
];

const MOCK_ORDERS = [
  { orderNumber: "ORD-2026-001", event: "Live Concert Sky Dec", amount: 1200000, status: "CONFIRMED", date: "2026-07-10" },
  { orderNumber: "ORD-2026-002", event: "Workshop Kỹ năng mềm", amount: 350000, status: "CONFIRMED", date: "2026-06-25" },
  { orderNumber: "ORD-2026-003", event: "Marathon TP.HCM", amount: 500000, status: "CANCELLED", date: "2026-05-18" },
];

const ROLE_COLORS: Record<string, string> = {
  BUYER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SELLER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Khách hàng",
  SELLER: "Nhà tổ chức",
  ADMIN: "Admin",
};

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-700" },
  PENDING: { label: "Chờ TT", className: "bg-yellow-100 text-yellow-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Hoàn tiền", className: "bg-gray-100 text-gray-700" },
};

export default function UsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("info");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users").catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      }
    } catch { /* use mock */ } finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || (statusFilter === "BLOCKED" ? u.isBlocked : !u.isBlocked);
    return matchSearch && matchRole && matchStatus;
  });

  const handleToggleBlock = async (user: any) => {
    try {
      const res = await api.patch(`/admin/users/${user.id}/block`).catch(() => null);
      if (res?.data?.success) {
        toast.success(res.data.message);
        loadUsers();
      } else {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u));
        toast.success(user.isBlocked ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
      }
    } catch { toast.error("Có lỗi xảy ra."); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này không?")) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`).catch(() => null);
      if (res?.data?.success) {
        toast.success(res.data.message);
        loadUsers();
      } else {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success("Đã xóa tài khoản.");
      }
    } catch { toast.error("Có lỗi xảy ra."); }
  };

  const openDetail = (user: any) => {
    setSelectedUser(user);
    setDetailOpen(true);
    setActiveDetailTab("info");
  };

  const buyerCount = users.filter(u => u.role === "BUYER").length;
  const sellerCount = users.filter(u => u.role === "SELLER").length;
  const blockedCount = users.filter(u => u.isBlocked).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý tài khoản 👥</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý tất cả người dùng trên nền tảng Lumora.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2 h-9 text-sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 h-9 text-sm">
            <Download className="h-4 w-4" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng người dùng", value: users.length, color: "text-foreground" },
          { label: "Khách hàng", value: buyerCount, color: "text-blue-500" },
          { label: "Nhà tổ chức", value: sellerCount, color: "text-purple-500" },
          { label: "Tài khoản khóa", value: blockedCount, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo Tên, Email, Username..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40 h-9 rounded-xl">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              <SelectItem value="BUYER">Khách hàng</SelectItem>
              <SelectItem value="SELLER">Nhà tổ chức</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 rounded-xl">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả TT</SelectItem>
              <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
              <SelectItem value="BLOCKED">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
          {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button variant="ghost" size="sm" className="h-9 rounded-xl gap-1.5" onClick={() => { setSearch(""); setRoleFilter("ALL"); setStatusFilter("ALL"); }}>
              <X className="h-3.5 w-3.5" /> Xóa bộ lọc
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider w-[40%]">Người dùng</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Vai trò</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Đơn hàng</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden lg:table-cell">Chi tiêu</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Không tìm thấy người dùng nào.</TableCell></TableRow>
            ) : filtered.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        {user.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">@{user.username} · {user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm font-semibold">{user.orders}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm font-semibold">{(user.totalSpent || 0).toLocaleString("vi-VN")}₫</span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isBlocked ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                    {user.isBlocked ? "Đã khóa" : "Hoạt động"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openDetail(user)} title="Xem chi tiết">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-lg ${user.isBlocked ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" : "text-orange-500 hover:text-orange-600 hover:bg-orange-50"}`}
                      onClick={() => handleToggleBlock(user)}
                      title={user.isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                    >
                      {user.isBlocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(user.id)}
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
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Chi tiết tài khoản</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback className="text-xl font-black bg-primary/10 text-primary">{selectedUser.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{selectedUser.name}</h3>
                    {selectedUser.isVerified && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[selectedUser.role]}`}>{ROLE_LABELS[selectedUser.role]}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">@{selectedUser.username} · {selectedUser.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tham gia: {selectedUser.createdAt}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-border">
                {[
                  { key: "info", label: "Thông tin" },
                  { key: "orders", label: `Lịch sử mua (${selectedUser.orders})` },
                  { key: "payment", label: "Thanh toán" },
                  { key: "complaint", label: "Khiếu nại" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveDetailTab(tab.key)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeDetailTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeDetailTab === "info" && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Email", value: selectedUser.email },
                    { label: "Username", value: `@${selectedUser.username}` },
                    { label: "Vai trò", value: ROLE_LABELS[selectedUser.role] },
                    { label: "Xác minh email", value: selectedUser.isVerified ? "Đã xác minh ✅" : "Chưa xác minh ❌" },
                    { label: "Trạng thái", value: selectedUser.isBlocked ? "Đã khóa 🔒" : "Hoạt động ✅" },
                    { label: "Ngày tham gia", value: selectedUser.createdAt },
                    { label: "Tổng đơn hàng", value: `${selectedUser.orders} đơn` },
                    { label: "Tổng chi tiêu", value: `${(selectedUser.totalSpent || 0).toLocaleString("vi-VN")} ₫` },
                  ].map(item => (
                    <div key={item.label} className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                      <p className="font-semibold mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeDetailTab === "orders" && (
                <div className="space-y-2">
                  {MOCK_ORDERS.map(order => (
                    <div key={order.orderNumber} className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-semibold">{order.event}</p>
                        <p className="text-xs text-muted-foreground">{order.orderNumber} · {order.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS[order.status]?.className}`}>{ORDER_STATUS[order.status]?.label}</span>
                        <p className="text-sm font-bold">{(order.amount || 0).toLocaleString("vi-VN")}₫</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeDetailTab === "payment" && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Chưa có lịch sử thanh toán</p>
                </div>
              )}

              {activeDetailTab === "complaint" && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Chưa có khiếu nại nào</p>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  className={`rounded-xl gap-2 ${selectedUser.isBlocked ? "text-emerald-500 border-emerald-300 hover:bg-emerald-50" : "text-orange-500 border-orange-300 hover:bg-orange-50"}`}
                  onClick={() => { handleToggleBlock(selectedUser); setDetailOpen(false); }}
                >
                  {selectedUser.isBlocked ? <><CheckCircle2 className="h-4 w-4" /> Mở khóa</> : <><Ban className="h-4 w-4" /> Khóa tài khoản</>}
                </Button>
                <Button className="rounded-xl" onClick={() => setDetailOpen(false)}>Đóng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
