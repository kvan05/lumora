"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Users, Calendar, Ticket, TrendingUp, RefreshCw,
  ShoppingCart, AlertCircle, CheckCircle2, Clock, Activity, Zap, ShieldAlert,
  Scale, FileText, ArrowUpRight, CheckCircle, XCircle, ArrowRight, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminControlCenter() {
  const router = useRouter();
  const [period, setPeriod] = useState("30d");

  // Fetch 100% Real Control Center Data from Backend API
  const { data: ccData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-control-center", period],
    queryFn: async () => {
      const res = await api.get(`/admin/control-center?period=${period}`);
      return res.data.success ? res.data.data : null;
    },
  });

  const summary = ccData?.summary || {
    totalUsers: 0, totalBuyers: 0, totalSellers: 0, totalEvents: 0,
    totalOrders: 0, totalTickets: 0, totalTicketsSold: 0, totalTicketsCheckedIn: 0,
    totalGMV: 0, platformRevenue: 0, totalRefund: 0, pendingWithdrawal: 0, pendingComplaint: 0
  };

  const ticketAnalytics = ccData?.ticketAnalytics || { sold: 0, available: 0, checkedIn: 0, notCheckedIn: 0, checkinRate: 0 };
  const paymentAnalytics = ccData?.paymentAnalytics || { successful: 0, pending: 0, failed: 0, refunded: 0, successRate: 100 };
  const revenueTimeline = Array.isArray(ccData?.revenueTimeline) ? ccData.revenueTimeline : [];
  const topEvents = Array.isArray(ccData?.topEvents) ? ccData.topEvents : [];
  const systemAlerts = Array.isArray(ccData?.systemAlerts) ? ccData.systemAlerts : [];

  const maxRevenue = Math.max(...revenueTimeline.map((item: any) => item.revenue || 0), 1000000);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Activity className="h-7 w-7 text-primary" /> Admin Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trung tâm điều hành hệ thống toàn diện Lumora — Giám sát giao dịch, chỉ số vé và rủi ro thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Tabs value={period} onValueChange={setPeriod} className="w-auto">
            <TabsList className="rounded-xl h-9 p-1 bg-muted/40 border">
              <TabsTrigger value="7d" className="rounded-lg text-xs font-bold px-3">7 ngày</TabsTrigger>
              <TabsTrigger value="30d" className="rounded-lg text-xs font-bold px-3">30 ngày</TabsTrigger>
              <TabsTrigger value="90d" className="rounded-lg text-xs font-bold px-3">90 ngày</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            onClick={() => { refetch(); toast.success("Cập nhật chỉ số điều hành mới nhất!"); }}
            variant="outline"
            className="rounded-xl gap-2 h-9 border-border/60"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Dynamic System Alerts Banner */}
      {systemAlerts.length > 0 && (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 shadow-xs overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> System Alerts — Cảnh Báo Điều Hành Hệ Thống ({systemAlerts.length})
            </CardTitle>
            <Link href="/admin/risk-alerts">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-amber-600 font-bold hover:bg-amber-500/10">
                Xem Risk Center <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <div className="space-y-1.5">
              {systemAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-xl text-xs font-semibold text-amber-950 dark:text-amber-200">
                  <span className="truncate">{alert.message}</span>
                  <Link href={alert.link}>
                    <Badge variant="outline" className="cursor-pointer border-amber-500/40 text-amber-600 bg-background/50 hover:bg-background shrink-0">
                      Xử lý ngay
                    </Badge>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Core Executive Stat Cards - ALL CLICKABLE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* 1. Tổng GMV -> Reconciliation */}
        <Link href="/admin/reconciliation" className="block">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs hover:border-emerald-500 hover:bg-emerald-500/5 hover:scale-[1.02] transition-all cursor-pointer h-full group">
            <CardContent className="pt-3.5 pb-3.5 px-3.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase group-hover:text-emerald-600">Tổng GMV</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-emerald-600 transition-all" />
                </div>
                {isLoading ? <Skeleton className="h-7 w-20 mt-1" /> : (
                  <p className="text-lg font-black text-foreground group-hover:text-emerald-600 mt-0.5">{summary.totalGMV.toLocaleString("vi-VN")} ₫</p>
                )}
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5">Phí sàn 5%: {summary.platformRevenue.toLocaleString("vi-VN")} ₫</p>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Đơn hàng mua vé -> Orders */}
        <Link href="/admin/orders" className="block">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs hover:border-blue-500 hover:bg-blue-500/5 hover:scale-[1.02] transition-all cursor-pointer h-full group">
            <CardContent className="pt-3.5 pb-3.5 px-3.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase group-hover:text-blue-600">Đơn Hàng Mua Vé</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-all" />
                </div>
                {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{summary.totalOrders} đơn</p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">Toàn bộ giao dịch</p>
            </CardContent>
          </Card>
        </Link>

        {/* 3. Người dùng sàn -> Users */}
        <Link href="/admin/users" className="block">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs hover:border-purple-500 hover:bg-purple-500/5 hover:scale-[1.02] transition-all cursor-pointer h-full group">
            <CardContent className="pt-3.5 pb-3.5 px-3.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase group-hover:text-purple-600">Người Dùng Sàn</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-purple-600 transition-all" />
                </div>
                {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                  <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">{summary.totalUsers} thành viên</p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">Buyers: {summary.totalBuyers} · Sellers: {summary.totalSellers}</p>
            </CardContent>
          </Card>
        </Link>

        {/* 4. Sự kiện khởi tạo -> Events */}
        <Link href="/admin/events" className="block">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs hover:border-orange-500 hover:bg-orange-500/5 hover:scale-[1.02] transition-all cursor-pointer h-full group">
            <CardContent className="pt-3.5 pb-3.5 px-3.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase group-hover:text-orange-600">Sự Kiện Khởi Tạo</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-orange-600 transition-all" />
                </div>
                {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                  <p className="text-lg font-black text-orange-500 mt-0.5">{summary.totalEvents} sự kiện</p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">Trên hệ thống</p>
            </CardContent>
          </Card>
        </Link>

        {/* 5. Rút tiền chờ duyệt -> Organizers / Reconciliation */}
        <Link href="/admin/users/organizers" className="block">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs hover:border-amber-500 hover:bg-amber-500/5 hover:scale-[1.02] transition-all cursor-pointer h-full group">
            <CardContent className="pt-3.5 pb-3.5 px-3.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase group-hover:text-amber-600">Rút Tiền Chờ Duyệt</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-amber-600 transition-all" />
                </div>
                {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                  <p className={`text-lg font-black mt-0.5 ${summary.pendingWithdrawal > 0 ? "text-amber-500" : "text-foreground"}`}>
                    {summary.pendingWithdrawal} đơn
                  </p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">Cần Admin xử lý</p>
            </CardContent>
          </Card>
        </Link>

        {/* 6. Tổng hoàn tiền -> Reconciliation / Orders */}
        <Link href="/admin/reconciliation" className="block">
          <Card className="rounded-2xl border-border/50 bg-card shadow-xs hover:border-red-500 hover:bg-red-500/5 hover:scale-[1.02] transition-all cursor-pointer h-full group">
            <CardContent className="pt-3.5 pb-3.5 px-3.5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase group-hover:text-red-600">Tổng Hoàn Tiền</p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-red-600 transition-all" />
                </div>
                {isLoading ? <Skeleton className="h-7 w-20 mt-1" /> : (
                  <p className="text-lg font-black text-red-500 mt-0.5">{summary.totalRefund.toLocaleString("vi-VN")} ₫</p>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">Đã chấp thuận refund</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Revenue Timeline Chart Bar */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Biểu Đồ Doanh Thu Tổng Theo Chu Kỳ ({period})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Giá trị giao dịch Gross GMV tính theo ngày từ CSDL thực tế</p>
          </div>
          <Badge variant="outline" className="font-mono text-xs text-emerald-600 bg-emerald-500/10 border-emerald-500/30 w-fit">
            Platform Fee: 5%
          </Badge>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : revenueTimeline.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs font-semibold">Chưa có dữ liệu doanh thu trong khoảng thời gian này</div>
        ) : (
          <div className="space-y-2">
            <div className="h-44 flex items-end gap-1.5 pt-4 border-b border-border/40 pb-2 overflow-x-auto">
              {revenueTimeline.map((item: any, idx: number) => {
                const heightPercent = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
                return (
                  <div key={idx} className="flex-1 min-w-[14px] flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t shadow-xs transition-all relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] p-1.5 rounded-lg border shadow-md whitespace-nowrap z-20 pointer-events-none">
                        <p className="font-bold">{item.date}</p>
                        <p className="text-emerald-500 font-black">{item.revenue.toLocaleString("vi-VN")} ₫</p>
                        <p className="text-muted-foreground">Phí: {item.fee.toLocaleString("vi-VN")} ₫</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>{revenueTimeline[0]?.date}</span>
              <span>{revenueTimeline[Math.floor(revenueTimeline.length / 2)]?.date}</span>
              <span>{revenueTimeline[revenueTimeline.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Ticket Analytics & Payment Analytics Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ticket Analytics - Clickable to Check-in / Tickets */}
        <Link href="/admin/checkin" className="block">
          <Card className="rounded-3xl border-border/50 bg-card shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 group-hover:text-purple-600">
                  <Ticket className="h-5 w-5 text-purple-500" /> Ticket Analytics & Check-in Rate <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <Badge variant="secondary" className="bg-purple-500/15 text-purple-600 font-bold text-xs">
                  Check-in Rate: {ticketAnalytics.checkinRate}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-2xl border">
                  <p className="text-xs text-muted-foreground font-semibold">Vé đã bán (Sold)</p>
                  <p className="text-xl font-black text-foreground mt-0.5">{ticketAnalytics.sold} vé</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-2xl border">
                  <p className="text-xs text-muted-foreground font-semibold">Vé đã Check-in</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{ticketAnalytics.checkedIn} vé</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Tỷ lệ vé đã soát cổng (Checked-in)</span>
                  <span>{ticketAnalytics.checkedIn} / {ticketAnalytics.sold} ({ticketAnalytics.checkinRate}%)</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${ticketAnalytics.checkinRate}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Payment Analytics - Clickable to Orders */}
        <Link href="/admin/orders" className="block">
          <Card className="rounded-3xl border-border/50 bg-card shadow-xs hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 group-hover:text-blue-600">
                  <ShoppingCart className="h-5 w-5 text-blue-500" /> Payment Analytics & Success Rate <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-500/15 text-blue-600 font-bold text-xs">
                  Success Rate: {paymentAnalytics.successRate}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Thành công</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{paymentAnalytics.successful}</p>
                </div>
                <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
                  <p className="text-[10px] text-amber-600 font-bold uppercase">Chờ xử lý</p>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{paymentAnalytics.pending}</p>
                </div>
                <div className="bg-red-500/10 p-2.5 rounded-2xl border border-red-500/20">
                  <p className="text-[10px] text-red-600 font-bold uppercase">Thất bại</p>
                  <p className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">{paymentAnalytics.failed}</p>
                </div>
                <div className="bg-gray-500/10 p-2.5 rounded-2xl border border-gray-500/20">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Hoàn tiền</p>
                  <p className="text-lg font-black text-foreground mt-0.5">{paymentAnalytics.refunded}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Tỷ lệ thanh toán thành công (Payment Success)</span>
                  <span>{paymentAnalytics.successRate}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${paymentAnalytics.successRate}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Top Events Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" /> Top Events — Sự Kiện Có Doanh Thu & Check-in Cao Nhất
            </CardTitle>
            <Link href="/admin/events">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1 text-primary">
                Xem tất cả sự kiện <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {isLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : topEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs font-semibold">Chưa có sự kiện nào bán được vé</div>
          ) : (
            <div className="space-y-3">
              {topEvents.map((ev: any, idx: number) => (
                <div key={ev.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-sm shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate text-foreground">{ev.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{ev.sellerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{ev.gmv.toLocaleString("vi-VN")} ₫</p>
                      <p className="text-[10px] text-muted-foreground">{ev.ticketsSold} vé bán</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="text-[10px] font-bold">Check-in: {ev.checkedInCount}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Quick Action Footer Bar */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Link href="/admin/risk-alerts">
          <Button variant="outline" className="w-full h-12 rounded-2xl justify-between font-bold text-xs border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600">
            <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Fraud Risk Detection Center</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <Link href="/admin/reconciliation">
          <Button variant="outline" className="w-full h-12 rounded-2xl justify-between font-bold text-xs border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary">
            <span className="flex items-center gap-2"><Scale className="h-4 w-4" /> Financial Reconciliation Center</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>

        <Link href="/admin/audit-logs">
          <Button variant="outline" className="w-full h-12 rounded-2xl justify-between font-bold text-xs border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> System Audit Logs</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
