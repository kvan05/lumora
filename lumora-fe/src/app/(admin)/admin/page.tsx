"use client";

import { useState, useEffect } from "react";
import {
  Users, Calendar, Ticket, TrendingUp, RefreshCw, BarChart3,
  ShoppingCart, CreditCard, ArrowUpRight, ArrowDownRight,
  AlertCircle, CheckCircle2, Clock, Activity, Zap, Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { toast } from "sonner";

const STAT_CARDS = [
  {
    key: "totalRevenue",
    label: "Tổng doanh thu",
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    format: (v: number) => `${(v || 0).toLocaleString("vi-VN")} ₫`,
    sub: (v: number) => `Phí nền tảng: ${((v || 0) * 0.05).toLocaleString("vi-VN")} ₫`,
    trend: "+12.5%",
    trendUp: true,
  },
  {
    key: "totalOrders",
    label: "Đơn mua vé",
    icon: ShoppingCart,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    format: (v: number) => `${v || 0} đơn`,
    sub: () => "Tháng này",
    trend: "+8.2%",
    trendUp: true,
  },
  {
    key: "totalUsers",
    label: "Người dùng",
    icon: Users,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    format: (v: number) => `${v || 0} thành viên`,
    sub: (v: number, stats: any) => `Mua vé: ${stats?.totalBuyers || 0} | NTC: ${stats?.totalSellers || 0}`,
    trend: "+5.1%",
    trendUp: true,
  },
  {
    key: "totalEvents",
    label: "Sự kiện",
    icon: Calendar,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    format: (v: number) => `${v || 0} sự kiện`,
    sub: () => "Trên hệ thống",
    trend: "+3.8%",
    trendUp: true,
  },
];

const MOCK_RECENT_ORDERS = [
  { id: "ORD-001", buyer: "Nguyễn Văn A", event: "Live Concert Sky Dec", amount: 1200000, status: "CONFIRMED", time: "10 phút trước" },
  { id: "ORD-002", buyer: "Trần Thị B", event: "Workshop Vẽ Tranh", amount: 350000, status: "PENDING", time: "25 phút trước" },
  { id: "ORD-003", buyer: "Lê Văn C", event: "Marathon TP.HCM", amount: 500000, status: "CONFIRMED", time: "1 giờ trước" },
  { id: "ORD-004", buyer: "Phạm Thị D", event: "Hà Anh Tuấn Concert", amount: 2500000, status: "CANCELLED", time: "2 giờ trước" },
  { id: "ORD-005", buyer: "Vũ Minh E", event: "Triển lãm Art Festival", amount: 200000, status: "CONFIRMED", time: "3 giờ trước" },
];

const MOCK_PENDING_EVENTS = [
  { id: "1", title: "Đêm nhạc Bolero 2026", organizer: "Công ty Âm nhạc Phương Nam", category: "Âm nhạc", date: "15/08/2026" },
  { id: "2", title: "Tech Summit Vietnam", organizer: "VietTech Corp", category: "Workshop", date: "20/08/2026" },
  { id: "3", title: "Food Festival Đà Nẵng", organizer: "Hội ẩm thực Đà Nẵng", category: "Ẩm thực", date: "01/09/2026" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PENDING: { label: "Chờ TT", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    totalRevenue: 520000000,
    totalOrders: 680,
    totalUsers: 1420,
    totalBuyers: 1250,
    totalSellers: 170,
    totalEvents: 45,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/stats").catch(() => null);
      if (res?.data?.success) setStats(res.data.data);
    } catch {
      /* use mock data */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Dashboard tổng quan 📊</h1>
          <p className="text-sm text-muted-foreground mt-1">Theo dõi toàn bộ hoạt động của nền tảng Lumora.</p>
        </div>
        <Button onClick={loadStats} variant="outline" className="rounded-xl gap-2 h-9 text-sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <Card key={card.key} className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">{card.label}</CardDescription>
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-2xl font-black">{card.format(stats[card.key])}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{card.sub(stats[card.key], stats)}</p>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${card.trendUp ? "text-emerald-500" : "text-red-500"}`}>
                  {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {card.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Duyệt sự kiện chờ", href: "/admin/events", icon: Calendar, badge: MOCK_PENDING_EVENTS.length },
              { label: "Xem đơn hàng mới", href: "/admin/orders", icon: ShoppingCart, badge: 12 },
              { label: "Xử lý hoàn tiền", href: "/admin/refunds", icon: RefreshCw, badge: 5 },
              { label: "Báo cáo vi phạm", href: "/admin/reports", icon: AlertCircle, badge: 3 },
            ].map((action) => (
              <a key={action.href} href={action.href}>
                <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9 relative">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                  {action.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                      {action.badge}
                    </span>
                  )}
                </Button>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" /> Đơn hàng gần đây
              </CardTitle>
              <a href="/admin/orders">
                <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg">Xem tất cả</Button>
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {MOCK_RECENT_ORDERS.map((order, i) => (
              <div key={order.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{order.buyer}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.event} · {order.time}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[order.status]?.className}`}>
                      {STATUS_BADGE[order.status]?.label}
                    </span>
                    <p className="text-xs font-bold text-right">{order.amount.toLocaleString("vi-VN")}₫</p>
                  </div>
                </div>
                {i < MOCK_RECENT_ORDERS.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Events */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" /> Sự kiện chờ duyệt
              </CardTitle>
              <a href="/admin/events">
                <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg">Xem tất cả</Button>
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {MOCK_PENDING_EVENTS.map((event, i) => (
              <div key={event.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{event.organizer}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{event.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{event.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" className="h-7 text-xs px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white">Duyệt</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-3 rounded-lg text-destructive hover:bg-destructive/10 border-destructive/30">Từ chối</Button>
                  </div>
                </div>
                {i < MOCK_PENDING_EVENTS.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Platform Fee Config */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Cấu hình phí dịch vụ nền tảng
          </CardTitle>
          <CardDescription className="text-xs">Tỷ lệ phần trăm thu từ nhà tổ chức trên mỗi vé bán thành công.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end max-w-sm">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold">Phí dịch vụ (%)</label>
              <div className="relative">
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-border bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <Button className="h-10 rounded-xl px-5 text-sm" onClick={() => toast.success("Đã cập nhật phí dịch vụ!")}>
              Lưu
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Ví dụ: Khách mua 1.000.000₫ → Organizer nhận 950.000₫, Lumora thu 50.000₫</p>
        </CardContent>
      </Card>
    </div>
  );
}
