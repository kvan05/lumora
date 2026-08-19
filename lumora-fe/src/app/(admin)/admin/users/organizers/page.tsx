"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Building2, Search, CheckCircle2, XCircle, Eye, FileText, Ban, RefreshCw,
  Calendar, MapPin, Globe, Share2, User, CreditCard, Banknote, Clock, RotateCcw,
  Plus, Edit, Trash2, Filter, AlertTriangle, ShieldCheck, Ticket, TrendingUp, ExternalLink,
  MessageSquareText, Save, Image as ImageIcon, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BUSINESS_CATEGORIES = [
  "Concert & Âm nhạc",
  "Sân khấu & Kịch",
  "Thể thao",
  "Workshop / Khóa học",
  "Tham quan & Du lịch",
  "Hội thảo / Sự kiện doanh nghiệp",
  "Công viên & Giải trí",
  "Ẩm thực",
  "Triển lãm",
  "Khác",
];

export default function OrganizersPage() {
  const queryClient = useQueryClient();

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("all");

  // Modal states
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "documents" | "events" | "settlements" | "adminNote">("profile");
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adminNoteText, setAdminNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Fetch Organizers list with parameters
  const { data: organizersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-organizers", search, statusFilter, categoryFilter, periodFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (periodFilter !== "all") params.set("period", periodFilter);
      if (search) params.set("search", search);

      const res = await api.get(`/admin/organizers?${params.toString()}`);
      return res.data.success ? res.data.data : [];
    },
  });

  // Fetch Full Details of Selected Organizer
  const { data: selectedOrgDetail, isLoading: isDetailLoading, refetch: refetchDetail } = useQuery({
    queryKey: ["admin-organizer-detail", selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      const res = await api.get(`/admin/organizers/${selectedOrgId}/details`);
      const data = res.data.data;
      setAdminNoteText(data.adminNote || "");
      return data;
    },
    enabled: !!selectedOrgId,
  });

  const organizers = Array.isArray(organizersData) ? organizersData : [];

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setPeriodFilter("all");
    toast.success("Đã đặt lại tất cả bộ lọc");
  };

  // Approve Organizer Application Mutation
  const approveMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const res = await api.patch(`/admin/organizer-applications/${profileId}/approve`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã duyệt đơn đăng ký nhà tổ chức thành công!");
      setSelectedOrgId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Lỗi duyệt nhà tổ chức");
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
      setSelectedOrgId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Lỗi từ chối nhà tổ chức");
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
      if (selectedOrgId) refetchDetail();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi thay đổi trạng thái tài khoản");
    },
  });

  // Save Admin Internal Note
  const handleSaveAdminNote = async () => {
    if (!selectedOrgId) return;
    setIsSavingNote(true);
    try {
      await api.patch(`/admin/organizers/${selectedOrgId}/admin-note`, {
        adminNote: adminNoteText,
      });
      toast.success("Đã lưu ghi chú nội bộ Admin thành công!");
      refetchDetail();
      queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể lưu ghi chú");
    } finally {
      setIsSavingNote(false);
    }
  };

  // Real Summary Aggregates
  const totalCount = organizers.length;
  const approvedCount = organizers.filter((o: any) => o.status === "APPROVED" || o.status === "VERIFIED").length;
  const pendingCount = organizers.filter((o: any) => o.status === "PENDING").length;
  const totalRevenue = organizers.reduce((sum: number, o: any) => sum + Number(o.revenue || 0), 0);

  const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + " ₫";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Building2 className="h-8 w-8 text-primary" /> Quản Lý Nhà Tổ Chức (Organizer)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Duyệt đơn đăng ký doanh nghiệp, kiểm tra giấy phép kinh doanh, theo dõi doanh thu và quản lý tài khoản Seller.
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

      {/* 4 Interactive Clickable Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Organizers */}
        <Card
          onClick={() => setStatusFilter("ALL")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            statusFilter === "ALL"
              ? "border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/30 shadow-md scale-[1.02]"
              : "border-border/60 bg-card hover:border-blue-500/50 hover:bg-blue-500/5"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-wider">Tổng Số Nhà Tổ Chức</p>
              <p className="text-2xl font-black text-foreground mt-1">{totalCount}</p>
            </div>
            <div className={`p-3 rounded-2xl ${statusFilter === "ALL" ? "bg-blue-600 text-white" : "bg-blue-500/10 text-blue-600"}`}>
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Approved Organizers */}
        <Card
          onClick={() => setStatusFilter("APPROVED")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            statusFilter === "APPROVED"
              ? "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]"
              : "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider">Đã Duyệt Hoạt Động</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</p>
            </div>
            <div className={`p-3 rounded-2xl ${statusFilter === "APPROVED" ? "bg-emerald-600 text-white" : "bg-emerald-500/20 text-emerald-600"}`}>
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pending Organizers */}
        <Card
          onClick={() => setStatusFilter("PENDING")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            statusFilter === "PENDING"
              ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-md scale-[1.02]"
              : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-extrabold uppercase tracking-wider">Đơn Hồ Sơ Chờ Duyệt</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
            </div>
            <div className={`p-3 rounded-2xl ${statusFilter === "PENDING" ? "bg-amber-600 text-white" : "bg-amber-500/20 text-amber-600"}`}>
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Revenue */}
        <Card
          onClick={() => setStatusFilter("ALL")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-primary font-extrabold uppercase tracking-wider">Doanh Thu Tích Lũy NTC</p>
              <p className="text-xl font-black text-primary mt-1">{fmt(totalRevenue)}</p>
            </div>
            <div className="p-3 bg-primary/20 text-primary rounded-2xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Toolbar & Multi-Filter */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm Tên tổ chức, Email, SĐT, Mã ĐKKD..."
                className="pl-9 h-10 rounded-xl text-xs font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="text-xs font-bold">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Chờ duyệt (PENDING)</SelectItem>
                <SelectItem value="APPROVED" className="text-xs">Đã duyệt (APPROVED)</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Từ chối (REJECTED)</SelectItem>
                <SelectItem value="BLOCKED" className="text-xs">Đã khóa tài khoản</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="Lĩnh vực kinh doanh" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="text-xs font-bold">Tất cả lĩnh vực</SelectItem>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period Filter */}
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="Thời gian đăng ký" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs font-bold">Tất cả thời gian</SelectItem>
                <SelectItem value="7d" className="text-xs">7 ngày gần nhất</SelectItem>
                <SelectItem value="30d" className="text-xs">30 ngày gần nhất</SelectItem>
                <SelectItem value="90d" className="text-xs">90 ngày gần nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters & Results Badge */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-muted-foreground font-medium">
              Hiển thị <strong className="text-foreground">{organizers.length}</strong> kết quả
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 rounded-lg text-muted-foreground hover:text-foreground gap-1.5 font-semibold text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Đặt lại bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organizers Table */}
      <Card className="rounded-3xl border-border/60 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không tìm thấy Nhà tổ chức nào</p>
              <p className="text-xs mt-1">Vui lòng kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Tên Tổ Chức / Người Đại Diện</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Lĩnh Vực</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Mã ĐKKD</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Ngày Đăng Ký</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right hidden lg:table-cell">Doanh Thu</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Trạng Thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Thao Tác Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizers.map((org: any) => (
                    <TableRow key={org.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                            {org.orgName ? org.orgName.charAt(0).toUpperCase() : <Building2 className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-foreground line-clamp-1">{org.orgName}</p>
                            <p className="text-xs text-muted-foreground font-medium">👤 {org.representative} · {org.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="bg-muted/50 border-border/60 text-[11px] font-semibold">
                          {org.businessCategory || "Khác"}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <p className="text-xs font-mono font-bold">{org.businessLicense}</p>
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {org.createdAt ? format(new Date(org.createdAt), "dd/MM/yyyy", { locale: vi }) : "—"}
                      </TableCell>

                      <TableCell className="text-right hidden lg:table-cell">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {fmt(Number(org.revenue || 0))}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {org.status === "APPROVED" || org.status === "VERIFIED" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                              ✓ Đã duyệt
                            </Badge>
                          ) : org.status === "REJECTED" ? (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px] font-bold">
                              Từ chối
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold animate-pulse">
                              Chờ duyệt
                            </Badge>
                          )}
                          {org.isBlocked && (
                            <Badge className="bg-red-600 text-white border-none text-[9px] font-extrabold uppercase">
                              Đã khóa
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-bold gap-1 rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={() => { setSelectedOrgId(org.id); setActiveTab("profile"); }}
                          >
                            <Eye className="h-3.5 w-3.5" /> Chi tiết
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
                              className={`h-8 w-8 p-0 rounded-xl ${org.isBlocked ? "text-emerald-600 hover:bg-emerald-500/10" : "text-destructive hover:bg-destructive/10"}`}
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

      {/* Comprehensive 5-Tab Detail Modal */}
      {selectedOrgId && (
        <Dialog open={!!selectedOrgId} onOpenChange={(open) => !open && setSelectedOrgId(null)}>
          <DialogContent className="max-w-4xl w-[95vw] rounded-3xl p-6 bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="pb-4 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="font-extrabold text-xl flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" /> {selectedOrgDetail?.orgName || "Hồ sơ Nhà tổ chức"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Mã ID: {selectedOrgId} · Ngày đăng ký: {selectedOrgDetail?.createdAt ? format(new Date(selectedOrgDetail.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "—"}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                {selectedOrgDetail?.verifyStatus === "PENDING" ? (
                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">Chờ xét duyệt</Badge>
                ) : selectedOrgDetail?.verifyStatus === "APPROVED" ? (
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">Đã duyệt</Badge>
                ) : (
                  <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">Từ chối</Badge>
                )}
                {selectedOrgDetail?.isBlocked && (
                  <Badge className="bg-red-600 text-white font-bold">Tài khoản bị khóa</Badge>
                )}
              </div>
            </DialogHeader>

            {/* 5 Tab Selector Navigation */}
            <div className="flex items-center gap-1 border-b border-border/60 pt-2 pb-0 overflow-x-auto">
              {[
                { id: "profile", label: "Thông tin hồ sơ", icon: User },
                { id: "documents", label: `Giấy tờ (${selectedOrgDetail?.documents?.length || 0})`, icon: FileText },
                { id: "events", label: `Sự kiện (${selectedOrgDetail?.events?.length || 0})`, icon: Ticket },
                { id: "settlements", label: "Đối soát & Rút tiền", icon: CreditCard },
                { id: "adminNote", label: "Ghi chú nội bộ Admin", icon: MessageSquareText },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
                      active
                        ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {isDetailLoading ? (
                <div className="space-y-3 py-6">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : selectedOrgDetail ? (
                <>
                  {/* TAB 1: Profile Info */}
                  {activeTab === "profile" && (
                    <div className="space-y-4 text-xs">
                      {/* Banner & Logo */}
                      {selectedOrgDetail.orgBanner && (
                        <div className="relative h-32 rounded-2xl overflow-hidden border border-border/60">
                          <img src={selectedOrgDetail.orgBanner} alt="Org Banner" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
                          <p className="font-extrabold text-sm text-primary flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" /> Thông tin doanh nghiệp / ban tổ chức
                          </p>
                          <div className="space-y-1.5 pt-1">
                            <p><strong className="text-muted-foreground">Tên tổ chức:</strong> {selectedOrgDetail.orgName}</p>
                            <p><strong className="text-muted-foreground">Lĩnh vực:</strong> <Badge variant="outline" className="ml-1 text-[10px]">{selectedOrgDetail.businessCategory || "Khác"}</Badge></p>
                            <p><strong className="text-muted-foreground">Địa chỉ trụ sở:</strong> {selectedOrgDetail.address || "Chưa cập nhật"}</p>
                            <p><strong className="text-muted-foreground">Website:</strong> {selectedOrgDetail.website ? <a href={selectedOrgDetail.website} target="_blank" className="text-primary hover:underline ml-1">{selectedOrgDetail.website}</a> : "—"}</p>
                            <p><strong className="text-muted-foreground">Facebook:</strong> {selectedOrgDetail.facebook ? <a href={selectedOrgDetail.facebook} target="_blank" className="text-primary hover:underline ml-1">{selectedOrgDetail.facebook}</a> : "—"}</p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
                          <p className="font-extrabold text-sm text-primary flex items-center gap-1.5">
                            <User className="h-4 w-4" /> Người đại diện & Ngân hàng
                          </p>
                          <div className="space-y-1.5 pt-1">
                            <p><strong className="text-muted-foreground">Họ tên người đại diện:</strong> {selectedOrgDetail.representative || selectedOrgDetail.user?.name || "N/A"}</p>
                            <p><strong className="text-muted-foreground">Email:</strong> {selectedOrgDetail.user?.email || selectedOrgDetail.email}</p>
                            <p><strong className="text-muted-foreground">Số điện thoại:</strong> {selectedOrgDetail.user?.phone || selectedOrgDetail.phone}</p>
                            <p><strong className="text-muted-foreground">Tài khoản ngân hàng nhận tiền:</strong></p>
                            {selectedOrgDetail.bankInfo ? (
                              <p className="font-mono font-bold text-foreground bg-background p-2 rounded-xl border border-border/40 mt-1">
                                {selectedOrgDetail.bankInfo.bankName} - {selectedOrgDetail.bankInfo.accountNumber} ({selectedOrgDetail.bankInfo.accountHolder})
                              </p>
                            ) : (
                              <p className="text-muted-foreground italic">Chưa thêm thông tin ngân hàng</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedOrgDetail.orgDescription && (
                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-1">
                          <p className="font-extrabold text-xs text-muted-foreground uppercase">Mô tả giới thiệu tổ chức</p>
                          <p className="text-foreground leading-relaxed text-xs">{selectedOrgDetail.orgDescription}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Documents */}
                  {activeTab === "documents" && (
                    <div className="space-y-4">
                      {!selectedOrgDetail.documents || selectedOrgDetail.documents.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-xs">
                          <FileText className="h-10 w-10 mx-auto opacity-30 mb-2" />
                          <p>Chưa có giấy tờ xác minh nào được tải lên.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedOrgDetail.documents.map((doc: any) => (
                            <div key={doc.id} className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-primary uppercase">
                                  {doc.docType === "CCCD" ? "🪪 Ảnh CCCD cá nhân" : doc.docType === "SELFIE" ? "🤳 Ảnh Selfie cầm CCCD" : "🏢 Giấy phép kinh doanh"}
                                </span>
                                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={() => setPreviewImageUrl(doc.docUrl)}>
                                  Xem ảnh lớn
                                </Button>
                              </div>
                              <div className="h-44 rounded-xl overflow-hidden border border-border bg-black/10 cursor-pointer" onClick={() => setPreviewImageUrl(doc.docUrl)}>
                                <img src={doc.docUrl} alt={doc.docType} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Events History */}
                  {activeTab === "events" && (
                    <div className="space-y-3">
                      {!selectedOrgDetail.events || selectedOrgDetail.events.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-xs">
                          <Ticket className="h-10 w-10 mx-auto opacity-30 mb-2" />
                          <p>Nhà tổ chức này chưa tạo sự kiện nào.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedOrgDetail.events.map((ev: any) => {
                            const evRevenue = ev.orders?.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0) || 0;
                            return (
                              <div key={ev.id} className="p-4 rounded-2xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                  <p className="font-extrabold text-sm text-foreground line-clamp-1">{ev.title}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Địa điểm: {ev.venue}, {ev.city} · Trạng thái: <Badge variant="outline" className="text-[10px]">{ev.status}</Badge>
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs text-muted-foreground font-semibold">Doanh thu sự kiện</p>
                                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{fmt(evRevenue)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: Settlements & Withdrawals */}
                  {activeTab === "settlements" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground mb-2">Kỳ đối soát sự kiện</h4>
                        {!selectedOrgDetail.settlements || selectedOrgDetail.settlements.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-4 text-center border rounded-2xl">Chưa có kỳ đối soát nào.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedOrgDetail.settlements.map((s: any) => (
                              <div key={s.id} className="p-3 rounded-xl border border-border/40 bg-muted/10 flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-foreground">{s.event?.title || "Sự kiện"}</p>
                                  <p className="text-[10px] text-muted-foreground">Trạng thái: {s.status}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-emerald-600">{fmt(Number(s.netAmount))}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground mb-2">Lịch sử rút tiền</h4>
                        {!selectedOrgDetail.withdrawals || selectedOrgDetail.withdrawals.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-4 text-center border rounded-2xl">Chưa có yêu cầu rút tiền nào.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedOrgDetail.withdrawals.map((w: any) => (
                              <div key={w.id} className="p-3 rounded-xl border border-border/40 bg-muted/10 flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-foreground">Rút về: {w.bankName} - {w.accountNumber}</p>
                                  <p className="text-[10px] text-muted-foreground">Ngày: {format(new Date(w.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-foreground">{fmt(Number(w.amount))}</p>
                                  <Badge className="text-[9px] font-bold border-none" variant="secondary">{w.status}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Admin Internal Notes */}
                  {activeTab === "adminNote" && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
                        <p className="font-bold">Ghi chú nội bộ của Ban quản trị Admin</p>
                        <p className="mt-0.5 opacity-90">Chỉ Admin mới có thể xem và chỉnh sửa ghi chú này. Dùng để lưu vết uy tín, lưu ý đối soát hoặc lý do từng tạm khóa.</p>
                      </div>

                      <Textarea
                        placeholder="Nhập ghi chú nội bộ cho Nhà tổ chức này..."
                        className="min-h-[140px] rounded-2xl text-xs"
                        value={adminNoteText}
                        onChange={(e) => setAdminNoteText(e.target.value)}
                      />

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={handleSaveAdminNote}
                          disabled={isSavingNote}
                          className="rounded-xl text-xs font-bold gap-1.5"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {isSavingNote ? "Đang lưu..." : "Lưu ghi chú Admin"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer Actions */}
            <DialogFooter className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedOrgDetail?.user?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={`rounded-xl text-xs font-bold ${selectedOrgDetail.isBlocked ? "text-emerald-600 border-emerald-500/30" : "text-destructive border-destructive/30"}`}
                    onClick={() => toggleBlockMutation.mutate(selectedOrgDetail.user.id)}
                  >
                    {selectedOrgDetail.isBlocked ? "Mở khóa tài khoản Seller" : "Khóa tài khoản Seller"}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold" onClick={() => setSelectedOrgId(null)}>
                  Đóng
                </Button>

                {selectedOrgDetail?.verifyStatus === "PENDING" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-bold text-destructive border-destructive/30"
                      onClick={() => setIsRejectDialogOpen(true)}
                    >
                      Từ chối đơn
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      onClick={() => approveMutation.mutate(selectedOrgDetail.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt đơn đăng ký
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Reason Modal */}
      {isRejectDialogOpen && (
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border border-border shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-lg text-destructive flex items-center gap-2">
                <XCircle className="h-5 w-5" /> Từ Chối Đơn Đăng Ký Nhà Tổ Chức
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Vui lòng nhập lý do từ chối. Lý do này sẽ được gửi thông báo tới Seller.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Lý do từ chối <span className="text-destructive">*</span></label>
              <Textarea
                placeholder="VD: Ảnh CCCD bị mờ/mất góc, Thông tin người đại diện không khớp với giấy phép ĐKKD..."
                className="rounded-2xl text-xs min-h-[100px]"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold" onClick={() => setIsRejectDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold bg-destructive hover:bg-destructive/90 text-white gap-1.5"
                onClick={() =>
                  selectedOrgId &&
                  rejectMutation.mutate({ profileId: selectedOrgId, reason: rejectReason })
                }
                disabled={rejectMutation.isPending || !rejectReason.trim()}
              >
                Xác nhận Từ Chối
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImageUrl && (
        <Dialog open={!!previewImageUrl} onOpenChange={() => setPreviewImageUrl(null)}>
          <DialogContent className="max-w-3xl rounded-3xl p-4 bg-black/95 border border-white/20 text-white flex flex-col items-center">
            <div className="w-full flex justify-end">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0" onClick={() => setPreviewImageUrl(null)}>
                ✕
              </Button>
            </div>
            <img src={previewImageUrl} alt="Document Large Preview" className="max-h-[80vh] w-auto object-contain rounded-xl" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
