"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Search, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  XCircle,
  User,
  AlertCircle,
  QrCode,
  SlidersHorizontal,
  X,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Filter
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ETicketModal } from "@/components/ticket/EventTicket";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ thanh toán", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30", icon: Clock },
  CONFIRMED: { label: "Đã thanh toán", color: "bg-green-100 text-green-700 dark:bg-green-900/30", icon: CheckCircle2 },
  CHECKED_IN: { label: "Đã Check-in", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40", icon: ShieldCheck },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700 dark:bg-red-900/30", icon: XCircle },
  REFUNDED: { label: "Hoàn tiền", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30", icon: RotateCcw },
};

const TIME_PERIODS = [
  { label: "Tất cả", value: "all" },
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày gần nhất", value: "7d" },
  { label: "30 ngày gần nhất", value: "30d" },
  { label: "Tùy chọn", value: "custom" },
];

export default function SellerOrdersPage() {
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [timePeriod, setTimePeriod] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>("ALL");

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Build API Query string
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (selectedEventId !== "ALL") params.set("eventId", selectedEventId);
    if (timePeriod !== "all") params.set("period", timePeriod);
    if (timePeriod === "custom") {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    }
    if (selectedTicketTypeId !== "ALL") params.set("ticketTypeId", selectedTicketTypeId);
    
    return params.toString();
  }, [searchTerm, statusFilter, selectedEventId, timePeriod, startDate, endDate, selectedTicketTypeId]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["seller-orders", queryParams],
    queryFn: async () => {
      const res = await api.get(`/seller/orders?${queryParams}`);
      return res.data.data;
    },
  });

  const orders = data?.orders || [];
  const totalCount = data?.pagination?.total || orders.length || 0;
  const filterOptions = data?.filterOptions || { events: [], ticketTypes: [] };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSelectedEventId("ALL");
    setTimePeriod("all");
    setStartDate("");
    setEndDate("");
    setSelectedTicketTypeId("ALL");
  };

  const isFiltered = searchTerm !== "" || statusFilter !== "ALL" || selectedEventId !== "ALL" || timePeriod !== "all" || selectedTicketTypeId !== "ALL";

  const handleOpenTicket = (order: any) => {
    const firstItem = order.items?.[0];
    const ticketCode = firstItem?.ticketCode || `TKT-${order.id.slice(-8).toUpperCase()}`;
    setSelectedTicket({
      ticketCode: ticketCode,
      eventTitle: order.event.title,
      bannerUrl: order.event.bannerUrl,
      category: order.event.category || "Sự kiện",
      ticketType: firstItem?.ticketType?.name || "Vé Tiêu Chuẩn",
      startDate: order.event.startDate || order.createdAt,
      venue: order.event.venue || "Địa điểm sự kiện",
      city: order.event.city || "Việt Nam",
      status: order.status,
      isCheckedIn: firstItem?.isCheckedIn || false,
      holderName: order.buyer.name,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="h-8 w-8 text-primary" /> Quản lý Đơn hàng & Vé bán
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Theo dõi tất cả đơn hàng, tra cứu mã vé QR và lọc danh sách chi tiết.
          </p>
        </div>

        {isFiltered && (
          <Button variant="ghost" onClick={handleResetFilters} className="gap-1.5 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto">
            <X className="h-4 w-4" /> Reset bộ lọc
          </Button>
        )}
      </div>

      {/* Advanced Filter Toolbar */}
      <Card className="rounded-2xl border border-border/60 shadow-sm bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Bộ lọc tìm kiếm & Đơn hàng
            </div>
            {isFetching ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" /> Đang cập nhật...
              </span>
            ) : (
              <span className="text-xs font-bold text-muted-foreground">
                Hiển thị <span className="text-primary font-black">{totalCount}</span> kết quả
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Keyword Search */}
            <div className="space-y-1 sm:col-span-2 md:col-span-1 lg:col-span-1">
              <label className="text-xs font-bold text-muted-foreground">Từ khóa tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Mã đơn, tên, email, sđt..." 
                  className="pl-8 h-9 text-xs rounded-xl bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* 2. Order Status Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Trạng thái đơn</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl h-9 text-xs font-semibold">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL" className="font-bold text-xs">Tất cả trạng thái</SelectItem>
                  <SelectItem value="CONFIRMED" className="text-xs text-emerald-600 font-medium">Đã thanh toán</SelectItem>
                  <SelectItem value="PENDING" className="text-xs text-amber-600 font-medium">Chờ thanh toán</SelectItem>
                  <SelectItem value="CHECKED_IN" className="text-xs text-purple-600 font-medium">Đã Check-in</SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs text-red-600 font-medium">Đã hủy</SelectItem>
                  <SelectItem value="REFUNDED" className="text-xs text-indigo-600 font-medium">Hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Event Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Sự kiện</label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="rounded-xl h-9 text-xs font-semibold">
                  <SelectValue placeholder="Tất cả sự kiện" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  <SelectItem value="ALL" className="font-bold text-xs">Tất cả sự kiện</SelectItem>
                  {filterOptions.events.map((evt: any) => (
                    <SelectItem key={evt.id} value={evt.id} className="text-xs">{evt.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Time Period Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Khoảng thời gian</label>
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="rounded-xl h-9 text-xs font-semibold">
                  <SelectValue placeholder="Tất cả thời gian" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {TIME_PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 5. Ticket Type Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Loại vé</label>
              <Select value={selectedTicketTypeId} onValueChange={setSelectedTicketTypeId}>
                <SelectTrigger className="rounded-xl h-9 text-xs font-semibold">
                  <SelectValue placeholder="Tất cả loại vé" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  <SelectItem value="ALL" className="font-bold text-xs">Tất cả loại vé</SelectItem>
                  {filterOptions.ticketTypes.map((tt: any) => (
                    <SelectItem key={tt.id} value={tt.id} className="text-xs">{tt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Inputs if Custom Period selected */}
          {timePeriod === "custom" && (
            <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" /> Chọn từ ngày đến ngày:
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="rounded-xl h-8 text-xs w-40"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-xs font-bold text-muted-foreground">-</span>
                <Input
                  type="date"
                  className="rounded-xl h-8 text-xs w-40"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs w-[120px]">Mã đơn</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Khách hàng</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Sự kiện</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Ngày đặt</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Tổng tiền</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-center">Trạng thái</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Vé (Mã QR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {Array(7).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-10 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 opacity-50 text-muted-foreground" />
                      <p className="font-bold text-sm text-foreground">Không tìm thấy đơn hàng nào phù hợp</p>
                      <p className="text-xs">Thử thay đổi từ khóa tìm kiếm hoặc bấm Reset bộ lọc.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: any) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100 text-gray-700", icon: Ticket };
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <TableRow key={order.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs uppercase font-bold text-primary">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="truncate max-w-[150px]">
                            <div className="font-bold text-sm line-clamp-1">{order.buyer.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{order.buyer.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm line-clamp-2 max-w-[200px]">
                          {order.event.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {order.items.length} vé
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {Number(order.total ?? order.totalAmount ?? 0).toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${statusInfo.color} border-none font-semibold shadow-none text-xs py-1 px-2.5`}>
                          <StatusIcon className="w-3.5 h-3.5 mr-1 inline-block" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/5 shadow-xs"
                          onClick={() => handleOpenTicket(order)}
                        >
                          <QrCode className="h-3.5 w-3.5" /> Xem Vé
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* E-Ticket Preview Modal */}
      <ETicketModal open={isModalOpen} onOpenChange={setIsModalOpen} ticket={selectedTicket} />
    </div>
  );
}
