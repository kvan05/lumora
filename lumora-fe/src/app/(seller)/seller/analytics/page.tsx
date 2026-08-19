"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  BarChart3,
  TrendingUp,
  Ticket,
  Download,
  Calendar,
  RefreshCw,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Users,
  Building2,
  SlidersHorizontal,
  X,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const PERIODS = [
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "90 ngày", value: "90d" },
  { label: "Tất cả", value: "all" },
  { label: "Tùy chọn", value: "custom" },
];

export default function SellerAnalyticsPage() {
  // Filter States
  const [period, setPeriod] = useState<string>("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>("ALL");

  // UI States
  const [chartMode, setChartMode] = useState<"daily" | "event">("daily");
  const [eventSearch, setEventSearch] = useState<string>("");
  const [sortField, setSortField] = useState<"title" | "ticketsSold" | "revenue" | "checkedInCount" | "remainingTickets">("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Query Key built from active filters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("period", period);
    if (period === "custom") {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    }
    if (selectedEventId !== "ALL") {
      params.set("eventId", selectedEventId);
    }
    if (selectedTicketTypeId !== "ALL") {
      params.set("ticketTypeId", selectedTicketTypeId);
    }
    return params.toString();
  }, [period, startDate, endDate, selectedEventId, selectedTicketTypeId]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["seller-analytics", queryParams],
    queryFn: async () => {
      const res = await api.get(`/seller/analytics?${queryParams}`);
      return res.data.data;
    },
  });

  const handleResetFilters = () => {
    setPeriod("30d");
    setStartDate("");
    setEndDate("");
    setSelectedEventId("ALL");
    setSelectedTicketTypeId("ALL");
    setEventSearch("");
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/seller/reports/export?format=csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `lumora-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Không thể tải báo cáo");
    }
  };

  const fmt = (n: number) => (n || 0).toLocaleString("vi-VN");

  // Daily Chart Data
  const dailyChartData = useMemo(() => {
    return (data?.revenueByDay || []).map((d: any) => ({
      dateRaw: d.date,
      date: format(new Date(d.date), "dd/MM", { locale: vi }),
      "Doanh thu": d.revenue,
      "Số vé": d.ticketsCount,
    }));
  }, [data?.revenueByDay]);

  // Event Chart Data
  const eventChartData = useMemo(() => {
    return (data?.revenueByEvent || []).map((e: any) => ({
      name: e.eventTitle.length > 20 ? `${e.eventTitle.substring(0, 20)}...` : e.eventTitle,
      fullName: e.eventTitle,
      "Doanh thu": e.revenue,
      "Số vé": e.ticketsCount,
    }));
  }, [data?.revenueByEvent]);

  // Filtered & Sorted Event Table Data
  const sortedEventStats = useMemo(() => {
    const list = (data?.eventStats || []).filter((e: any) =>
      e.eventTitle.toLowerCase().includes(eventSearch.toLowerCase())
    );

    return list.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "title") {
        aVal = a.eventTitle;
        bVal = b.eventTitle;
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc" ? (aVal - bVal) : (bVal - aVal);
    });
  }, [data?.eventStats, eventSearch, sortField, sortOrder]);

  const handleSort = (field: "title" | "ticketsSold" | "revenue" | "checkedInCount" | "remainingTickets") => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const isFiltered = period !== "30d" || selectedEventId !== "ALL" || selectedTicketTypeId !== "ALL" || startDate !== "" || endDate !== "";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" /> Thống kê & Báo cáo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Theo dõi tổng quan doanh thu, số lượng vé bán và tỷ lệ check-in thực tế.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <Button variant="ghost" onClick={handleResetFilters} className="gap-1.5 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" /> Reset bộ lọc
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="gap-2 rounded-xl font-bold border-primary/30 text-primary hover:bg-primary/5">
            <Download className="h-4 w-4" /> Xuất Báo Cáo CSV
          </Button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <Card className="rounded-2xl border border-border/60 shadow-sm bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Bộ lọc dữ liệu
            </div>
            {isFetching && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" /> Đang cập nhật...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Period Preset Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Khoảng thời gian</label>
              <div className="flex bg-muted/60 rounded-xl p-1 gap-1 overflow-x-auto">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`flex-1 min-w-[50px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      period === p.value
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range Picker */}
            {period === "custom" && (
              <div className="space-y-1.5 sm:col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Từ ngày</label>
                  <Input
                    type="date"
                    className="rounded-xl h-9 text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Đến ngày</label>
                  <Input
                    type="date"
                    className="rounded-xl h-9 text-xs"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Event Select Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Lọc sự kiện</label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="rounded-xl h-9 text-xs font-semibold">
                  <SelectValue placeholder="Tất cả sự kiện" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  <SelectItem value="ALL" className="font-bold text-xs">Tất cả sự kiện</SelectItem>
                  {data?.sellerEventsList?.map((evt: any) => (
                    <SelectItem key={evt.id} value={evt.id} className="text-xs">{evt.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ticket Type Select Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Loại vé</label>
              <Select value={selectedTicketTypeId} onValueChange={setSelectedTicketTypeId}>
                <SelectTrigger className="rounded-xl h-9 text-xs font-semibold">
                  <SelectValue placeholder="Tất cả loại vé" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  <SelectItem value="ALL" className="font-bold text-xs">Tất cả loại vé</SelectItem>
                  {data?.ticketTypesList?.map((tt: any) => (
                    <SelectItem key={tt.id} value={tt.id} className="text-xs">{tt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <Card className="rounded-2xl border border-border/60 shadow-sm bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng doanh thu</span>
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {fmt(data?.summary?.totalRevenue || 0)} <span className="text-base font-bold text-primary">₫</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Trong khoảng thời gian đã chọn</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Total Orders */}
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng đơn hàng</span>
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {fmt(data?.summary?.totalOrders || 0)} <span className="text-base font-bold text-muted-foreground">đơn</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Đã hoàn tất thanh toán</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Tickets Sold */}
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vé đã bán</span>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <Ticket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {fmt(data?.summary?.totalTicketsSold || 0)} <span className="text-base font-bold text-muted-foreground">vé</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Trên toàn bộ sự kiện</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Check-in Rate */}
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tỷ lệ check-in</span>
              <div className="p-2.5 bg-purple-500/10 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div>
                <p className="text-3xl font-black text-foreground tracking-tight">
                  {data?.summary?.checkInRate || 0} <span className="text-base font-bold text-purple-600 dark:text-purple-400">%</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {fmt(data?.summary?.totalCheckedIn || 0)} / {fmt(data?.summary?.totalTicketsSold || 0)} vé đã quét
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Section */}
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-extrabold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Phân tích doanh thu
            </CardTitle>
            <CardDescription className="mt-0.5">
              Biểu đồ trực quan hóa tình hình kinh doanh theo thời gian hoặc theo từng sự kiện.
            </CardDescription>
          </div>

          {/* Chart Mode Switcher */}
          <div className="flex bg-muted/60 rounded-xl p-1 gap-1">
            <button
              onClick={() => setChartMode("daily")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                chartMode === "daily"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Theo ngày
            </button>
            <button
              onClick={() => setChartMode("event")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                chartMode === "event"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PieChartIcon className="h-3.5 w-3.5" /> Theo sự kiện
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-80 rounded-2xl" />
          ) : chartMode === "daily" ? (
            dailyChartData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-sm">Chưa có dữ liệu trong khoảng thời gian này</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dailyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === "Doanh thu" ? `${fmt(Number(value))} ₫` : fmt(Number(value)),
                      name
                    ]}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 13,
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="Doanh thu" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            eventChartData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-sm">Chưa có dữ liệu sự kiện</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={eventChartData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    formatter={(value: any) => [`${fmt(Number(value))} ₫`, "Doanh thu"]}
                    labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullName || label}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="Doanh thu" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]}>
                    {eventChartData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(var(--primary))" : "#8B5CF6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          )}
        </CardContent>
      </Card>

      {/* Event Details Table */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Bảng thống kê chi tiết theo sự kiện
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Chi tiết lượng vé đã bán, doanh thu và tỷ lệ check-in của từng sự kiện.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm tên sự kiện..."
              className="pl-9 h-9 rounded-xl bg-background text-xs"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="font-bold text-muted-foreground uppercase tracking-wider text-xs cursor-pointer select-none"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1">
                    Tên sự kiện <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right cursor-pointer select-none"
                  onClick={() => handleSort("ticketsSold")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Vé đã bán <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right cursor-pointer select-none"
                  onClick={() => handleSort("revenue")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Doanh thu <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right cursor-pointer select-none"
                  onClick={() => handleSort("checkedInCount")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Đã check-in <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right cursor-pointer select-none"
                  onClick={() => handleSort("remainingTickets")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Còn lại <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedEventStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                    Không tìm thấy sự kiện nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                sortedEventStats.map((evt: any) => (
                  <TableRow key={evt.eventId} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-bold text-sm text-foreground line-clamp-1">{evt.eventTitle}</div>
                      <Badge variant="outline" className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                        {evt.category || "Sự kiện"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {fmt(evt.ticketsSold)} <span className="text-xs font-normal text-muted-foreground">vé</span>
                    </TableCell>
                    <TableCell className="text-right font-black text-sm text-primary">
                      {fmt(evt.revenue)} ₫
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm text-purple-600 dark:text-purple-400">
                      {fmt(evt.checkedInCount)} <span className="text-xs font-normal text-muted-foreground">vé</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm text-muted-foreground">
                      {fmt(evt.remainingTickets)} <span className="text-xs font-normal">/ {fmt(evt.totalCapacity)}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
