"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import {
  Bell, Send, Users, ShieldCheck, ShoppingBag, UserCheck, Megaphone,
  AlertTriangle, Tag, Calendar, Search, RefreshCw, Trash2, CheckCircle2,
  Clock, Filter, ArrowUpRight, Sparkles, Mail, Link as LinkIcon, Eye, ShieldAlert,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AUDIENCE_OPTIONS = [
  {
    id: "ALL",
    label: "Tất cả người dùng",
    desc: "Gửi tới toàn bộ tài khoản Buyer, Seller & Staff trên hệ thống",
    icon: Users,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "SELLERS",
    label: "Tất cả Nhà tổ chức (Seller)",
    desc: "Gửi tới các nhà tổ chức sự kiện & đối tác doanh nghiệp",
    icon: ShieldCheck,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "BUYERS",
    label: "Tất cả Khách hàng (Buyer)",
    desc: "Gửi tới tập người dùng cá nhân đặt mua vé",
    icon: ShoppingBag,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "SPECIFIC_USER",
    label: "Người dùng cụ thể",
    desc: "Gửi trực tiếp tới 1 Email hoặc User ID cụ thể",
    icon: UserCheck,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
];

const NOTIF_TYPES = [
  { id: "ANNOUNCEMENT", label: "Thông báo chung", icon: Megaphone, badge: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "SYSTEM", label: "Cập nhật hệ thống", icon: Sparkles, badge: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  { id: "PROMOTION", label: "Khuyến mãi & Voucher", icon: Tag, badge: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
  { id: "ALERT", label: "Cảnh báo & Bảo trì", icon: AlertTriangle, badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { id: "EVENT_UPDATE", label: "Cập nhật sự kiện", icon: Calendar, badge: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
];

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("broadcast");

  // Broadcast Form State
  const [audience, setAudience] = useState("ALL");
  const [targetUserId, setTargetUserId] = useState("");
  const [notifType, setNotifType] = useState("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Log Table Filters & State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedNotif, setSelectedNotif] = useState<any>(null);

  // Query All Notifications Log
  const { data: logData, isLoading: isLogsLoading } = useQuery({
    queryKey: ["admin-notifications-log", page, search, typeFilter],
    queryFn: async () => {
      const res = await api.get("/notifications/admin/all", {
        params: { page, limit: 15, search, type: typeFilter || undefined },
      });
      return res.data.data;
    },
  });

  // Query Admin Personal Notifications Feed
  const { data: myNotifData, isLoading: isMyNotifLoading } = useQuery({
    queryKey: ["admin-my-notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications?limit=30");
      return res.data.data;
    },
  });

  // Mutation: Broadcast Notification
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/notifications/broadcast", {
        title,
        message,
        type: notifType,
        audience,
        targetUserId: audience === "SPECIFIC_USER" ? targetUserId : undefined,
        linkUrl: linkUrl.trim() || undefined,
        sendEmail,
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Phát thông báo thành công!");
      setShowConfirmModal(false);
      // Reset form partially
      setTitle("");
      setMessage("");
      setLinkUrl("");
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-log"] });
      setActiveTab("log");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Không thể gửi thông báo");
    },
  });

  // Mutation: Delete Notification
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/notifications/admin/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Đã xóa thông báo");
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-log"] });
      if (selectedNotif) setSelectedNotif(null);
    },
    onError: () => {
      toast.error("Không thể xóa thông báo");
    },
  });

  // Mutation: Mark My Notifications Read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-my-notifications"] });
    },
  });

  const notificationsList = logData?.notifications || [];
  const pagination = logData?.pagination;
  const myNotifications = myNotifData?.notifications || [];
  const unreadCount = myNotifData?.unreadCount || 0;

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-[#EB5B95]/10 text-[#EB5B95] border-[#EB5B95]/20 font-bold uppercase text-[10px] tracking-wider">
              HỆ THỐNG THÔNG BÁO & BROADCAST
            </Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Bell className="h-8 w-8 text-[#93C453]" /> Quản Lý Thông Báo Hệ Thống
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phát thông báo thời gian thực tới người dùng, quản lý nhật ký gửi và theo dõi cảnh báo quản trị.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setActiveTab("broadcast")}
            className="rounded-2xl font-bold bg-[#93C453] hover:bg-[#82B342] text-slate-900 shadow-md gap-2"
          >
            <Send className="h-4 w-4" /> Gửi Thông Báo Mới
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng Đã Phát</p>
              <h3 className="text-2xl font-black mt-1">{pagination?.total || 0}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">thông báo trên toàn hệ thống</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Megaphone className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Thông Báo Chưa Đọc</p>
              <h3 className="text-2xl font-black text-[#EB5B95] mt-1">{unreadCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">tin mới dành cho Admin</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EB5B95]/10 text-[#EB5B95] flex items-center justify-center shrink-0">
              <Bell className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nhóm Đối Tượng</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">4 Kênh</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">All, Seller, Buyer & Cá nhân</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Dispatch</p>
              <h3 className="text-2xl font-black text-amber-500 mt-1">Resend API</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Tích hợp gửi Email tự động</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Mail className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border p-1.5 rounded-2xl inline-flex gap-2 shadow-sm">
          <TabsTrigger value="broadcast" className="rounded-xl font-extrabold gap-2 data-[state=active]:bg-[#93C453] data-[state=active]:text-slate-900">
            <Send className="h-4 w-4" /> Phát Thông Báo Mới
          </TabsTrigger>
          <TabsTrigger value="log" className="rounded-xl font-extrabold gap-2 data-[state=active]:bg-[#93C453] data-[state=active]:text-slate-900">
            <Clock className="h-4 w-4" /> Nhật Ký Đã Gửi ({pagination?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="admin-feed" className="rounded-xl font-extrabold gap-2 data-[state=active]:bg-[#93C453] data-[state=active]:text-slate-900">
            <ShieldAlert className="h-4 w-4" /> Tin Nhắn Admin ({unreadCount})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BROADCAST FORM CENTER */}
        <TabsContent value="broadcast" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Section */}
            <Card className="lg:col-span-7 rounded-3xl border border-border shadow-md">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#EB5B95]" /> Soạn Thảo & Phát Thông Báo
                </CardTitle>
                <CardDescription>
                  Điền các thông tin bên dưới để gửi tin nhắn đẩy Socket.IO và Email tới người dùng.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Audience Selection Grid */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                    1. Chọn Nhóm Đối Tượng Nhận Tin (*)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AUDIENCE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = audience === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setAudience(opt.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${isSelected
                            ? "border-[#93C453] bg-[#93C453]/10 ring-2 ring-[#93C453]/30"
                            : "border-border/60 bg-card hover:border-border hover:bg-muted/40"
                            }`}
                        >
                          <div className={`p-2 rounded-xl border ${opt.color} shrink-0 mt-0.5`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-foreground">{opt.label}</p>
                            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{opt.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Specific User Target Input */}
                {audience === "SPECIFIC_USER" && (
                  <div className="space-y-2 animate-in fade-in duration-200 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                    <label className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Nhập Email hoặc User ID cá nhân (*)
                    </label>
                    <Input
                      placeholder="Ví dụ: buyer@lumora.vn hoặc user ID..."
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="rounded-xl bg-card"
                    />
                  </div>
                )}

                {/* Notification Type Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                    2. Phân Loại Thông Báo (*)
                  </label>
                  <Select value={notifType} onValueChange={setNotifType}>
                    <SelectTrigger className="rounded-xl h-11 font-bold">
                      <SelectValue placeholder="Chọn loại thông báo..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {NOTIF_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="font-medium">
                          <div className="flex items-center gap-2">
                            <t.icon className="h-4 w-4" />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title Input */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                    3. Tiêu Đề Thông Báo (*)
                  </label>
                  <Input
                    placeholder="Ví dụ: Sự kiện mới ra mắt! Giảm giá 20% hôm nay"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-xl h-11 font-bold"
                  />
                </div>

                {/* Content Message Textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                    4. Nội Dung Chi Tiết Thông Báo (*)
                  </label>
                  <Textarea
                    placeholder="Nhập nội dung đầy đủ của thông báo..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="rounded-xl min-h-[130px] resize-none"
                  />
                </div>

                {/* Link URL (Optional) */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                    <span>5. Đường Dẫn Đính Kèm (Không bắt buộc)</span>
                    <span className="text-[10px] text-muted-foreground lowercase">https://... hoặc /events/xxx</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ví dụ: /events/sky-dec-2026 hoặc https://lumora.vn/voucher"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="rounded-xl pl-10 h-11"
                    />
                  </div>
                </div>

                {/* Send Email Checkbox */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-muted/30">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-500" /> Gửi đồng thời qua Email (Email Notification)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gửi 1 bản sao email định dạng HTML qua dịch vụ Resend tới tất cả email người nhận.
                    </p>
                  </div>
                  <Checkbox checked={sendEmail} onCheckedChange={(c) => setSendEmail(!!c)} className="h-5 w-5 rounded-md" />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!title.trim() || !message.trim()) {
                        toast.error("Vui lòng điền tiêu đề và nội dung thông báo");
                        return;
                      }
                      if (audience === "SPECIFIC_USER" && !targetUserId.trim()) {
                        toast.error("Vui lòng nhập Email hoặc User ID người nhận");
                        return;
                      }
                      setShowConfirmModal(true);
                    }}
                    className="w-full rounded-2xl h-12 font-extrabold bg-[#93C453] hover:bg-[#82B342] text-slate-900 shadow-lg gap-2 text-base"
                  >
                    <Send className="h-5 w-5" /> Phát Thông Báo Ngay
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview Section */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-3xl border border-border/80 shadow-md bg-gradient-to-b from-card to-muted/20">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Eye className="h-4 w-4 text-[#EB5B95]" /> Xem Trước Giao Diện Tin Nhắn
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Đây là hình ảnh hiển thị của thông báo này khi tới ứng dụng / web của Khách hàng:
                  </p>

                  {/* Notification Mock Item */}
                  <div className="p-4 rounded-2xl border border-[#93C453]/30 bg-card shadow-lg space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#93C453]" />
                    <div className="flex items-start justify-between gap-2 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#93C453]/10 text-[#4A7C59] flex items-center justify-center font-bold">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div>
                          <Badge className="bg-[#93C453]/20 text-[#4A7C59] text-[10px] font-extrabold border-none px-2 py-0">
                            {NOTIF_TYPES.find((t) => t.id === notifType)?.label || "THÔNG BÁO"}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground">Vừa xong</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono">Chưa đọc</Badge>
                    </div>

                    <div className="pl-2 space-y-1">
                      <h4 className="font-extrabold text-sm text-foreground leading-snug">
                        {title || "Tiêu đề thông báo mẫu..."}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {message || "Nội dung thông báo sẽ xuất hiện ở đây..."}
                      </p>
                    </div>

                    {linkUrl && (
                      <div className="pl-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#EB5B95] hover:underline">
                          Xem chi tiết <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Recipient summary info */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Đối tượng nhận:</span>
                      <span className="font-bold text-foreground">
                        {AUDIENCE_OPTIONS.find((a) => a.id === audience)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gửi Email kèm theo:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {sendEmail ? "Có (Resend Email)" : "Không"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: SENT NOTIFICATIONS LOG TABLE */}
        <TabsContent value="log" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-md">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" /> Nhật Ký Thông Báo Hệ Thống
                  </CardTitle>
                  <CardDescription>
                    Danh sách toàn bộ thông báo đã phát tới người dùng trong cơ sở dữ liệu.
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm tiêu đề, email..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9 rounded-xl h-9 text-xs"
                    />
                  </div>

                  <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val === "ALL" ? "" : val); setPage(1); }}>
                    <SelectTrigger className="w-40 h-9 text-xs rounded-xl font-bold">
                      <SelectValue placeholder="Lọc theo loại..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ALL">Tất cả loại</SelectItem>
                      {NOTIF_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-notifications-log"] })}
                    className="rounded-xl h-9"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {isLogsLoading ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#93C453]" />
                  <p className="text-sm font-medium">Đang tải nhật ký thông báo...</p>
                </div>
              ) : notificationsList.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground space-y-2">
                  <Bell className="h-10 w-10 mx-auto opacity-30" />
                  <p className="font-bold">Không tìm thấy thông báo nào</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-black uppercase tracking-wider">
                      <th className="p-4">Người nhận</th>
                      <th className="p-4">Tiêu đề & Nội dung</th>
                      <th className="p-4">Loại thông báo</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Thời gian</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {notificationsList.map((notif: any) => {
                      const notifTypeObj = NOTIF_TYPES.find((t) => t.id === notif.type);
                      return (
                        <tr key={notif.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={notif.user?.avatar} />
                                <AvatarFallback className="font-bold text-xs bg-[#93C453]/20 text-[#4A7C59]">
                                  {notif.user?.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-extrabold text-foreground">{notif.user?.name || "Người dùng"}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">{notif.user?.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 max-w-xs">
                            <p className="font-extrabold text-foreground truncate">{notif.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{notif.message}</p>
                          </td>

                          <td className="p-4">
                            <Badge className={`border px-2 py-0.5 text-[10px] font-bold ${notifTypeObj?.badge || "bg-muted text-muted-foreground"}`}>
                              {notifTypeObj?.label || notif.type}
                            </Badge>
                          </td>

                          <td className="p-4">
                            {notif.isRead ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Đã đọc
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                                <Clock className="h-3.5 w-3.5" /> Chưa đọc
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-muted-foreground font-mono">
                            {format(new Date(notif.createdAt), "HH:mm — dd/MM/yyyy", { locale: vi })}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedNotif(notif)}
                                className="h-8 w-8 rounded-lg"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Bạn có chắc muốn xóa thông báo này?")) {
                                    deleteMutation.mutate(notif.id);
                                  }
                                }}
                                className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages} ({pagination.total} bản ghi)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl h-8"
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl h-8"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 3: ADMIN PERSONAL FEED */}
        <TabsContent value="admin-feed" className="space-y-6">
          <Card className="rounded-3xl border border-border shadow-md">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#EB5B95]" /> Thông Báo Dành Cho Admin
              </CardTitle>
              <CardDescription>
                Cảnh báo giao dịch, duyệt sự kiện mới và khiếu nại từ nhà tổ chức.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {isMyNotifLoading ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#93C453]" />
                </div>
              ) : myNotifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground space-y-2">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                  <p className="font-bold">Không có thông báo mới nào cho Admin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myNotifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-4 ${!n.isRead
                        ? "border-[#93C453]/40 bg-[#93C453]/5 font-medium"
                        : "border-border/60 bg-card"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-[#EB5B95]/10 text-[#EB5B95] shrink-0 mt-0.5">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-foreground">{n.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                            {format(new Date(n.createdAt), "HH:mm — dd/MM/yyyy", { locale: vi })}
                          </p>
                        </div>
                      </div>

                      {!n.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markReadMutation.mutate(n.id)}
                          className="rounded-xl text-xs shrink-0"
                        >
                          Đánh dấu đã đọc
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog before sending broadcast */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="rounded-3xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-[#93C453]" /> Xác Nhận Phát Thông Báo?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bạn có chắc chắn muốn gửi thông báo này tới nhóm <span className="font-bold text-foreground">{AUDIENCE_OPTIONS.find(a => a.id === audience)?.label}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
            <p className="font-extrabold text-foreground">{title}</p>
            <p className="text-muted-foreground line-clamp-3">{message}</p>
            {sendEmail && (
              <p className="text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                Sẽ gửi đồng thời Email qua Resend
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="rounded-xl">
              Hủy bỏ
            </Button>
            <Button
              onClick={() => broadcastMutation.mutate()}
              disabled={broadcastMutation.isPending}
              className="rounded-xl font-bold bg-[#93C453] hover:bg-[#82B342] text-slate-900 gap-2"
            >
              {broadcastMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Xác Nhận Phát Ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!selectedNotif} onOpenChange={(op) => !op && setSelectedNotif(null)}>
        <DialogContent className="rounded-3xl max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#93C453]" /> Chi Tiết Thông Báo Đã Gửi
            </DialogTitle>
          </DialogHeader>

          {selectedNotif && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">Người nhận:</span>
                  <span className="font-extrabold">{selectedNotif.user?.name} ({selectedNotif.user?.email})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">Thời gian:</span>
                  <span>{format(new Date(selectedNotif.createdAt), "HH:mm — dd/MM/yyyy", { locale: vi })}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-black uppercase text-muted-foreground text-[10px]">Tiêu đề</label>
                <p className="font-extrabold text-base text-foreground">{selectedNotif.title}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-black uppercase text-muted-foreground text-[10px]">Nội dung</label>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{selectedNotif.message}</p>
              </div>

              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setSelectedNotif(null)} className="rounded-xl">
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
