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
  ChevronRight, Filter, Loader2, ArrowUpRight, TrendingUp, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SellerCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [segmentFilter, setSegmentFilter] = useState<"ALL" | "VIP" | "LOYAL">("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Fetch Seller Events for Filter Dropdown
  const { data: eventsData } = useQuery({
    queryKey: ["seller-events-filter"],
    queryFn: async () => {
      const res = await api.get("/seller/events");
      return res.data.data;
    },
  });

  // Fetch Customers Data
  const { data: customersData, isLoading } = useQuery({
    queryKey: ["seller-customers", page, search, selectedEventId],
    queryFn: async () => {
      const res = await api.get("/seller/customers", {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          eventId: selectedEventId || undefined,
        },
      });
      return res.data.data;
    },
  });

  const sellerEvents = eventsData?.events || eventsData || [];
  const rawCustomers = customersData?.customers || [];
  const stats = customersData?.stats;
  const pagination = customersData?.pagination;

  // Filter segment in memory
  const filteredCustomers = rawCustomers.filter((c: any) => {
    if (segmentFilter === "VIP") return c.totalSpent >= 1000000;
    if (segmentFilter === "LOYAL") return c.orderCount >= 2;
    return true;
  });

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      toast.error("Không có dữ liệu khách hàng để xuất báo cáo");
      return;
    }

    const headers = ["Họ Tên", "Email", "Số Điện Thoại", "Tổng Số Đơn", "Tổng Số Vé", "Tổng Chi Tiêu (VND)", "Lần Mua Cuối"];
    const rows = filteredCustomers.map((c: any) => [
      `"${c.name || "Khách hàng"}"`,
      `"${c.email}"`,
      `"${c.phone || "-"}"`,
      c.orderCount,
      c.totalTickets,
      c.totalSpent,
      `"${c.lastOrderDate ? format(new Date(c.lastOrderDate), "dd/MM/yyyy") : "-"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Danh_Sach_Khach_Hang_Lumora_${format(new Date(), "ddMMyyyy")}.csv`);
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
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-[#93C453]" /> Danh Sách Khách Hàng Đã Mua Vé
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi danh sách khách hàng mua vé, lịch sử giao dịch và phân tích mức độ gắn kết với sự kiện.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-2xl font-bold border-border shadow-sm gap-2 hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Xuất Danh Sách CSV
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng Khách Hàng</p>
              <h3 className="text-2xl font-black mt-1">{stats?.totalCustomers || 0}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">khách hàng cá nhân đã mua vé</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vé Đã Bán</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats?.totalTicketsSold || 0}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">tổng lượt vé đã thanh toán</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Ticket className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng Doanh Thu</p>
              <h3 className="text-2xl font-black text-[#EB5B95] mt-1">
                {stats?.totalRevenue ? Number(stats.totalRevenue).toLocaleString("vi-VN") : 0} đ
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">doanh số mua vé của khách</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EB5B95]/10 text-[#EB5B95] flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mức Chi TB / Khách</p>
              <h3 className="text-2xl font-black text-amber-500 mt-1">
                {stats?.avgSpendPerCustomer ? Number(stats.avgSpendPerCustomer).toLocaleString("vi-VN") : 0} đ
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">giá trị trung bình đơn khách hàng</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Customers List Card */}
      <Card className="rounded-3xl border border-border shadow-md">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                <Users className="h-5 w-5 text-[#93C453]" /> Danh Sách Chi Tiết Khách Hàng
              </CardTitle>
              <CardDescription>
                Tìm kiếm theo tên, email, số điện thoại hoặc lọc theo từng sự kiện cụ thể.
              </CardDescription>
            </div>

            {/* Segment Tabs */}
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border/60">
              <Button
                variant={segmentFilter === "ALL" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSegmentFilter("ALL")}
                className="rounded-xl text-xs font-bold"
              >
                Tất cả ({rawCustomers.length})
              </Button>
              <Button
                variant={segmentFilter === "VIP" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSegmentFilter("VIP")}
                className="rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400"
              >
                Khách VIP (&gt;1Tr)
              </Button>
              <Button
                variant={segmentFilter === "LOYAL" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSegmentFilter("LOYAL")}
                className="rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400"
              >
                Thân thiết (&ge;2 Đơn)
              </Button>
            </div>
          </div>

          {/* Search & Event Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4">
            <div className="md:col-span-7 relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo Tên khách hàng, Email hoặc Số điện thoại..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 rounded-2xl h-10 text-xs"
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
                <SelectTrigger className="rounded-2xl h-10 text-xs font-medium">
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

            <div className="md:col-span-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearch("");
                  setSelectedEventId("");
                  setPage(1);
                }}
                className="w-full h-10 rounded-2xl"
                title="Làm mới bộ lọc"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#93C453]" />
              <p className="text-sm font-medium">Đang tải dữ liệu khách hàng...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Users className="h-10 w-10 mx-auto opacity-30" />
              <p className="font-bold text-base">Không tìm thấy khách hàng nào</p>
              <p className="text-xs max-w-sm mx-auto">
                Chưa có dữ liệu người mua phù hợp với từ khóa hoặc bộ lọc sự kiện hiện tại.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-black uppercase tracking-wider">
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Liên hệ</th>
                  <th className="p-4">Số lượng đơn / Vé</th>
                  <th className="p-4">Tổng chi tiêu</th>
                  <th className="p-4">Sự kiện đã tham gia</th>
                  <th className="p-4">Lần mua gần nhất</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCustomers.map((customer: any) => {
                  const isVip = customer.totalSpent >= 1000000;
                  const isLoyal = customer.orderCount >= 2;

                  return (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border shadow-xs">
                            <AvatarImage src={customer.avatar} />
                            <AvatarFallback className="font-extrabold text-xs bg-[#93C453]/20 text-[#4A7C59]">
                              {customer.name?.[0]?.toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
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
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">ID: {customer.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Order & Ticket Count */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-sm text-foreground">{customer.orderCount} Đơn hàng</span>
                          <p className="text-[11px] text-muted-foreground font-medium">({customer.totalTickets} vé thành công)</p>
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="p-4">
                        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {Number(customer.totalSpent).toLocaleString("vi-VN")} đ
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
                                className="text-[10px] font-medium bg-muted/50 border-border/80 truncate max-w-[160px]"
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
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                          className="rounded-xl text-xs font-bold gap-1 text-[#EB5B95] hover:text-[#d84883] hover:bg-[#EB5B95]/10"
                        >
                          <Eye className="h-3.5 w-3.5" /> Chi tiết
                        </Button>
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
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} khách hàng)
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

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(op) => !op && setSelectedCustomer(null)}>
        <DialogContent className="rounded-3xl max-w-2xl p-6">
          <DialogHeader className="border-b border-border/60 pb-4">
            <DialogTitle className="font-extrabold text-xl flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={selectedCustomer?.avatar} />
                <AvatarFallback className="bg-[#93C453]/20 text-[#4A7C59] font-bold">
                  {selectedCustomer?.name?.[0]?.toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>Lịch Sử Đặt Vé: {selectedCustomer?.name}</span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">{selectedCustomer?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6 pt-2">
              {/* Summary stat row inside modal */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Tổng đơn mua</p>
                  <p className="text-lg font-black text-foreground mt-0.5">{selectedCustomer.orderCount} Đơn</p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Số vé đã sở hữu</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedCustomer.totalTickets} Vé
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Tổng tiền đã chi</p>
                  <p className="text-lg font-black text-[#EB5B95] mt-0.5">
                    {Number(selectedCustomer.totalSpent).toLocaleString("vi-VN")} đ
                  </p>
                </div>
              </div>

              {/* Order History Timeline */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[#93C453]" /> Các Đơn Hàng Đã Thanh Toán
                </h4>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedCustomer.ordersHistory && selectedCustomer.ordersHistory.length > 0 ? (
                    selectedCustomer.ordersHistory.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl border border-border/70 bg-card hover:border-border space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="font-extrabold text-foreground font-mono">#{ord.orderNumber}</span>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {format(new Date(ord.confirmedAt || ord.createdAt), "dd/MM/yyyy — HH:mm", { locale: vi })}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-extrabold text-sm text-foreground">{ord.event?.title}</p>
                            <div className="mt-1 space-y-0.5 text-muted-foreground">
                              {ord.items?.map((item: any, idx: number) => (
                                <p key={idx} className="text-[11px]">
                                  • {item.ticketType?.name || "Vé"} {item.seat ? `(Ghế ${item.seat.seatLabel})` : ""} x{item.quantity || 1}
                                </p>
                              ))}
                            </div>
                          </div>
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                            {Number(ord.total).toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Chưa có lịch sử chi tiết.</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="rounded-xl">
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
