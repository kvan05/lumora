"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import {
  Users, Search, Download, Calendar, Ticket, CreditCard, Award,
  Sparkles, RefreshCw, Eye, Mail, Phone, ShoppingBag, ExternalLink,
  ChevronRight, Filter, Loader2, ArrowUpRight, TrendingUp, ShieldCheck,
  Copy, Check, Send, CheckCircle2, Clock, AlertCircle, ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function SellerCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [segmentFilter, setSegmentFilter] = useState<"ALL" | "VIP" | "LOYAL" | "NEW">("ALL");
  const [sortBy, setSortBy] = useState<"recent" | "spent_desc" | "orders_desc">("recent");
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [emailModalCustomer, setEmailModalCustomer] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch Seller Events for Filter Dropdown
  const { data: eventsData } = useQuery({
    queryKey: ["seller-events-filter"],
    queryFn: async () => {
      const res = await api.get("/seller/events");
      return res.data.data;
    },
  });

  // Fetch Customers Data from BE
  const { data: customersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["seller-customers", page, search, selectedEventId, segmentFilter, sortBy],
    queryFn: async () => {
      const res = await api.get("/seller/customers", {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          eventId: selectedEventId || undefined,
          segment: segmentFilter === "ALL" ? undefined : segmentFilter,
          sortBy,
        },
      });
      return res.data.data;
    },
  });

  const sellerEvents = eventsData?.events || eventsData || [];
  const customers = customersData?.customers || [];
  const stats = customersData?.stats;
  const pagination = customersData?.pagination;

  // Copy helper function
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Open Quick Email Modal
  const handleOpenEmailModal = (customer: any) => {
    setEmailModalCustomer(customer);
    setEmailSubject(`[Lumora] Thông tin chăm sóc khách hàng - ${customer.name || "Khách hàng"}`);
    setEmailBody(`Xin chào ${customer.name || "bạn"},\n\nCảm ơn bạn đã đồng hành và đặt vé tham gia sự kiện của chúng tôi trên nền tảng Lumora.\n\nTrân trọng,\nĐội ngũ Ban Tổ Chức`);
  };

  // Send Email Handler (opens client mailto)
  const handleSendEmail = () => {
    if (!emailModalCustomer?.email) return;
    const mailtoUrl = `mailto:${emailModalCustomer.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, "_blank");
    toast.success("Đã mở ứng dụng Email để gửi thư cho khách hàng!");
    setEmailModalCustomer(null);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast.error("Không có dữ liệu khách hàng để xuất báo cáo");
      return;
    }

    const headers = [
      "ID Khách Hàng",
      "Họ Tên",
      "Email",
      "Số Điện Thoại",
      "Tổng Số Đơn",
      "Tổng Số Vé",
      "Tổng Chi Tiêu (VND)",
      "Lần Mua Cuối",
      "Sự Kiện Đã Tham Gia"
    ];

    const rows = customers.map((c: any) => [
      `"${c.id}"`,
      `"${c.name || "Khách hàng"}"`,
      `"${c.email}"`,
      `"${c.phone || "-"}"`,
      c.orderCount,
      c.totalTickets,
      c.totalSpent,
      `"${c.lastOrderDate ? format(new Date(c.lastOrderDate), "dd/MM/yyyy HH:mm") : "-"}"`,
      `"${c.events?.map((e: any) => `${e.title} (${e.ticketCount} vé)`).join("; ") || "-"}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Danh_Sach_Khach_Hang_Lumora_${format(new Date(), "ddMMyyyy_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất danh sách khách hàng thành file CSV!");
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-[#93C453]/10 text-[#4A7C59] border-[#93C453]/20 font-bold uppercase text-[10px] tracking-wider">
              QUẢN LÝ DỮ LIỆU KHÁCH HÀNG
            </Badge>
            {isFetching && (
              <Badge variant="outline" className="text-[10px] animate-pulse flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin text-[#93C453]" /> Đang cập nhật...
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-[#93C453]" /> Danh Sách Khách Hàng Đã Mua Vé
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi phân khúc khách hàng, lịch sử giao dịch và tổng quan mức độ gắn kết với các sự kiện của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="icon"
            className="rounded-2xl h-10 w-10 border border-border"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-2xl font-bold border-border shadow-sm gap-2 hover:bg-muted"
          >
            <Download className="h-4 w-4 text-[#93C453]" /> Xuất Danh Sách CSV
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card via-card to-blue-500/5 hover:border-blue-500/30 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng Khách Hàng</p>
              <h3 className="text-3xl font-black mt-1 text-foreground">{stats?.totalCustomers || 0}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-500" /> Khách cá nhân đã mua vé
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 shadow-xs">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card via-card to-emerald-500/5 hover:border-emerald-500/30 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vé Đã Bán</p>
              <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats?.totalTicketsSold || 0}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Ticket className="h-3 w-3 text-emerald-500" /> Tổng lượt vé thanh toán
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-xs">
              <Ticket className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card via-card to-[#EB5B95]/5 hover:border-[#EB5B95]/30 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng Doanh Thu</p>
              <h3 className="text-3xl font-black text-[#EB5B95] mt-1">
                {stats?.totalRevenue ? Number(stats.totalRevenue).toLocaleString("vi-VN") : 0} ₫
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-[#EB5B95]" /> Doanh số mua vé của khách
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EB5B95]/10 text-[#EB5B95] flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card via-card to-amber-500/5 hover:border-amber-500/30 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mức Chi TB / Khách</p>
              <h3 className="text-3xl font-black text-amber-500 mt-1">
                {stats?.avgSpendPerCustomer ? Number(stats.avgSpendPerCustomer).toLocaleString("vi-VN") : 0} ₫
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Award className="h-3 w-3 text-amber-500" /> Giá trị trung bình/khách
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Customers Table Card */}
      <Card className="rounded-3xl border border-border shadow-md overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                <Users className="h-5 w-5 text-[#93C453]" /> Danh Sách Chi Tiết Khách Hàng
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Tìm kiếm thông tin theo tên, email, số điện thoại hoặc lọc theo phân khúc và từng sự kiện.
              </CardDescription>
            </div>

            {/* Segment Quick Filter Buttons */}
            <div className="flex items-center gap-1 bg-muted/60 p-1.5 rounded-2xl border border-border/60 self-start lg:self-auto">
              <Button
                variant={segmentFilter === "ALL" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setSegmentFilter("ALL"); setPage(1); }}
                className="rounded-xl text-xs font-bold px-3"
              >
                Tất cả
              </Button>
              <Button
                variant={segmentFilter === "VIP" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setSegmentFilter("VIP"); setPage(1); }}
                className="rounded-xl text-xs font-bold px-3 text-amber-600 dark:text-amber-400"
              >
                VIP (&gt;1Tr ₫)
              </Button>
              <Button
                variant={segmentFilter === "LOYAL" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setSegmentFilter("LOYAL"); setPage(1); }}
                className="rounded-xl text-xs font-bold px-3 text-emerald-600 dark:text-emerald-400"
              >
                Thân thiết (&ge;2 Đơn)
              </Button>
              <Button
                variant={segmentFilter === "NEW" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setSegmentFilter("NEW"); setPage(1); }}
                className="rounded-xl text-xs font-bold px-3 text-blue-600 dark:text-blue-400"
              >
                Khách mới (1 Đơn)
              </Button>
            </div>
          </div>

          {/* Search, Event & Sorting Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo Tên khách hàng, Email hoặc Số điện thoại..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 rounded-2xl h-10 text-xs bg-background"
              />
            </div>

            <div className="md:col-span-4">
              <Select
                value={selectedEventId}
                onValueChange={(val) => {
                  setSelectedEventId(val === "ALL" ? "" : val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="rounded-2xl h-10 text-xs font-medium bg-background">
                  <SelectValue placeholder="Lọc theo tất cả sự kiện..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="ALL">Tất cả sự kiện của tôi</SelectItem>
                  {Array.isArray(sellerEvents) &&
                    sellerEvents.map((ev: any) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Select
                value={sortBy}
                onValueChange={(val: any) => {
                  setSortBy(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="rounded-2xl h-10 text-xs font-medium bg-background">
                  <SelectValue placeholder="Sắp xếp..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="recent">Mới mua gần đây</SelectItem>
                  <SelectItem value="spent_desc">Chi tiêu cao nhất</SelectItem>
                  <SelectItem value="orders_desc">Nhiều đơn nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-9 w-9 animate-spin text-[#93C453]" />
              <p className="text-sm font-medium">Đang truy xuất danh sách khách hàng...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto opacity-50">
                <Users className="h-8 w-8" />
              </div>
              <p className="font-bold text-base text-foreground">Không tìm thấy dữ liệu khách hàng nào</p>
              <p className="text-xs max-w-md mx-auto text-muted-foreground">
                Chưa có lịch sử người mua phù hợp với từ khóa hoặc bộ lọc phân khúc / sự kiện hiện tại của bạn.
              </p>
              {(search || selectedEventId || segmentFilter !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedEventId("");
                    setSegmentFilter("ALL");
                    setPage(1);
                  }}
                  className="rounded-xl mt-2 text-xs font-bold"
                >
                  Xóa tất cả bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-black uppercase tracking-wider">
                  <th className="p-4 pl-6">Khách hàng</th>
                  <th className="p-4">Liên hệ</th>
                  <th className="p-4">Số đơn / Vé</th>
                  <th className="p-4">Tổng chi tiêu</th>
                  <th className="p-4">Sự kiện đã mua</th>
                  <th className="p-4">Lần mua gần nhất</th>
                  <th className="p-4 pr-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {customers.map((customer: any) => {
                  const isVip = customer.totalSpent >= 1000000;
                  const isLoyal = customer.orderCount >= 2;
                  const isNew = customer.orderCount === 1;

                  return (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                      {/* Customer Info */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/80 shadow-xs shrink-0">
                            <AvatarImage src={customer.avatar} />
                            <AvatarFallback className="font-extrabold text-xs bg-[#93C453]/20 text-[#4A7C59]">
                              {customer.name?.[0]?.toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-sm text-foreground">{customer.name || "Khách hàng"}</p>
                              {isVip && (
                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-black px-1.5 py-0">
                                  VIP
                                </Badge>
                              )}
                              {isLoyal && !isVip && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black px-1.5 py-0">
                                  Thân thiết
                                </Badge>
                              )}
                              {isNew && !isVip && (
                                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[9px] font-black px-1.5 py-0">
                                  Mới
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">ID: {customer.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-foreground group">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-[11px]">{customer.email}</span>
                          <button
                            onClick={() => handleCopy(customer.email, `email ${customer.email}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            title="Sao chép email"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground group">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono text-[11px]">{customer.phone}</span>
                            <button
                              onClick={() => handleCopy(customer.phone, `SĐT ${customer.phone}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              title="Sao chép số điện thoại"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Order & Ticket Count */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-sm text-foreground">{customer.orderCount} Đơn hàng</span>
                          <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                            <Ticket className="h-3 w-3 text-emerald-500" /> ({customer.totalTickets} vé sở hữu)
                          </p>
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="p-4">
                        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {Number(customer.totalSpent).toLocaleString("vi-VN")} ₫
                        </span>
                      </td>

                      {/* Events Attended Tags */}
                      <td className="p-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {customer.events && customer.events.length > 0 ? (
                            customer.events.map((ev: any) => (
                              <Badge
                                key={ev.id}
                                variant="outline"
                                className="text-[10px] font-medium bg-muted/40 border-border/80 truncate max-w-[160px]"
                              >
                                {ev.title} ({ev.ticketCount} vé)
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Chưa xác định</span>
                          )}
                        </div>
                      </td>

                      {/* Last Order Date */}
                      <td className="p-4 text-muted-foreground font-mono text-[11px]">
                        {customer.lastOrderDate
                          ? format(new Date(customer.lastOrderDate), "dd/MM/yyyy — HH:mm", { locale: vi })
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEmailModal(customer)}
                            className="rounded-xl text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 gap-1 h-8"
                            title="Gửi Email trao đổi"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                            className="rounded-xl text-xs font-bold gap-1 text-[#EB5B95] hover:text-[#d84883] hover:bg-[#EB5B95]/10 h-8"
                          >
                            <Eye className="h-3.5 w-3.5" /> Chi tiết
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
          <div className="p-4 border-t border-border flex items-center justify-between text-xs bg-muted/20">
            <span className="text-muted-foreground font-medium">
              Hiển thị trang <strong className="text-foreground">{pagination.page}</strong> / {pagination.totalPages} ({pagination.total} khách hàng)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl h-8 font-bold"
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl h-8 font-bold"
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Customer Detail Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={(op) => !op && setSelectedCustomer(null)}>
        <DialogContent className="rounded-3xl max-w-3xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b border-border/60 pb-4 shrink-0">
            <DialogTitle className="font-extrabold text-xl flex items-center gap-3">
              <Avatar className="h-11 w-11 border border-border">
                <AvatarImage src={selectedCustomer?.avatar} />
                <AvatarFallback className="bg-[#93C453]/20 text-[#4A7C59] font-bold text-base">
                  {selectedCustomer?.name?.[0]?.toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-lg font-black">{selectedCustomer?.name || "Khách hàng"}</span>
                <p className="text-xs text-muted-foreground font-mono font-normal flex items-center gap-2 mt-0.5">
                  <span>{selectedCustomer?.email}</span>
                  {selectedCustomer?.phone && <span>• {selectedCustomer?.phone}</span>}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="overflow-y-auto pr-1 py-4 space-y-6 flex-1">
              {/* Summary stat cards inside modal */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tổng đơn mua</p>
                  <p className="text-xl font-black text-foreground mt-0.5">{selectedCustomer.orderCount} Đơn</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Vé đã sở hữu</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedCustomer.totalTickets} Vé
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Tổng tiền đã chi</p>
                  <p className="text-xl font-black text-[#EB5B95] mt-0.5">
                    {Number(selectedCustomer.totalSpent).toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>

              {/* Tabs for Order History & Tickets */}
              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="w-full grid grid-cols-2 rounded-2xl bg-muted/60 p-1">
                  <TabsTrigger value="orders" className="rounded-xl text-xs font-bold">
                    <ShoppingBag className="h-3.5 w-3.5 mr-1.5 text-[#93C453]" /> Lịch Sử Đơn Hàng ({selectedCustomer.ordersHistory?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="tickets" className="rounded-xl text-xs font-bold">
                    <Ticket className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Tất Cả Vé Mua ({selectedCustomer.totalTickets || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Orders History */}
                <TabsContent value="orders" className="pt-4 space-y-3">
                  {selectedCustomer.ordersHistory && selectedCustomer.ordersHistory.length > 0 ? (
                    selectedCustomer.ordersHistory.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl border border-border/70 bg-card hover:border-border transition-all space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-foreground font-mono text-sm">#{ord.orderNumber}</span>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                              {ord.status}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {format(new Date(ord.confirmedAt || ord.createdAt), "dd/MM/yyyy — HH:mm", { locale: vi })}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-[#93C453]" /> {ord.event?.title}
                          </p>

                          <div className="bg-muted/30 p-3 rounded-xl space-y-1.5 border border-border/40">
                            {ord.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    • {item.ticketType?.name || "Vé"} {item.seat ? `(Ghế ${item.seat.seatLabel})` : ""} x{item.quantity || 1}
                                  </span>
                                  {item.ticketCode && (
                                    <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                                      {item.ticketCode}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.isCheckedIn ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold">
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Đã Check-in
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground text-[9px]">
                                      Chưa check-in
                                    </Badge>
                                  )}
                                  <span className="font-bold text-foreground">
                                    {Number(item.subtotal || item.unitPrice * (item.quantity || 1)).toLocaleString("vi-VN")} ₫
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                          <span className="text-muted-foreground font-medium">Tổng tiền đơn hàng:</span>
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {Number(ord.total).toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">Chưa có lịch sử đơn hàng nào.</p>
                  )}
                </TabsContent>

                {/* Tab 2: Tickets Breakdown */}
                <TabsContent value="tickets" className="pt-4 space-y-3">
                  <div className="space-y-2">
                    {selectedCustomer.ordersHistory?.flatMap((o: any) =>
                      (o.items || []).map((item: any) => ({ ...item, eventTitle: o.event?.title, orderNumber: o.orderNumber }))
                    )?.map((ticket: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl border border-border/70 bg-card flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-foreground">{ticket.ticketType?.name || "Vé sự kiện"}</span>
                            {ticket.seat && (
                              <Badge variant="secondary" className="text-[10px] font-bold">
                                Ghế: {ticket.seat.seatLabel}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span>Sự kiện: <strong>{ticket.eventTitle}</strong></span>
                            <span>• Đơn #{ticket.orderNumber}</span>
                          </p>
                          {ticket.ticketCode && (
                            <p className="font-mono text-[10px] text-muted-foreground">Mã vé: {ticket.ticketCode}</p>
                          )}
                        </div>

                        <div>
                          {ticket.isCheckedIn ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold py-1 px-2">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Đã tham gia
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] py-1 px-2">
                              <Clock className="h-3 w-3 mr-1" /> Hợp lệ / Sẵn sàng
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="border-t border-border/60 pt-3 shrink-0 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                handleOpenEmailModal(selectedCustomer);
                setSelectedCustomer(null);
              }}
              className="rounded-xl text-xs font-bold gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Mail className="h-3.5 w-3.5" /> Gửi Email Liên Hệ
            </Button>

            <Button variant="secondary" onClick={() => setSelectedCustomer(null)} className="rounded-xl text-xs font-bold">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Email Composition Modal */}
      <Dialog open={!!emailModalCustomer} onOpenChange={(op) => !op && setEmailModalCustomer(null)}>
        <DialogContent className="rounded-3xl max-w-xl p-6">
          <DialogHeader className="border-b border-border/60 pb-3">
            <DialogTitle className="font-extrabold text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" /> Gửi Thư Liên Hệ Khách Hàng
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gửi thông điệp trao đổi hoặc chăm sóc khách hàng tới <strong>{emailModalCustomer?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Tiêu đề thư (Subject)</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Nhập tiêu đề thư..."
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Nội dung thư (Message Body)</label>
              <Textarea
                rows={6}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Nhập nội dung thư gửi khách hàng..."
                className="rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEmailModalCustomer(null)} className="rounded-xl text-xs">
              Hủy
            </Button>
            <Button
              onClick={handleSendEmail}
              className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Send className="h-3.5 w-3.5" /> Mở Email Client & Gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
