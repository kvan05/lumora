"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Ticket, Download, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const PERIODS = [
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "90 ngày", value: "90d" },
];

export default function SellerAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["seller-analytics", period],
    queryFn: async () => {
      const res = await api.get(`/seller/analytics?period=${period}`);
      return res.data.data;
    },
  });

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

  const fmt = (n: number) => n.toLocaleString("vi-VN");

  const chartData = (data?.revenueByDay || []).map((d: any) => ({
    date: format(new Date(d.date), "dd/MM", { locale: vi }),
    "Doanh thu": d.revenue,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" /> Thống kê & Báo cáo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Theo dõi doanh thu và hiệu quả bán vé</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/60 rounded-xl p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  period === p.value
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={handleExport} className="gap-2 rounded-xl font-bold">
            <Download className="h-4 w-4" /> Xuất CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-semibold">Tổng doanh thu ({PERIODS.find(p => p.value === period)?.label})</p>
            </div>
            <p className="text-3xl font-black">{fmt(data?.totalRevenue || 0)} <span className="text-base font-medium text-muted-foreground">₫</span></p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Ticket className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm text-muted-foreground font-semibold">Đơn hàng ({PERIODS.find(p => p.value === period)?.label})</p>
            </div>
            <p className="text-3xl font-black">{data?.totalOrders || 0} <span className="text-base font-medium text-muted-foreground">đơn</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Doanh thu theo ngày
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có dữ liệu trong khoảng thời gian này</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value || 0).toLocaleString("vi-VN")} ₫`, "Doanh thu"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: 13 }}
                />
                <Bar dataKey="Doanh thu" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Events */}
      {data?.topEvents && data.topEvents.length > 0 && (
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-extrabold">Top sự kiện theo doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topEvents.map((e: any, idx: number) => (
                <div key={e.eventId} className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                    idx === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    idx === 1 ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" :
                    idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{e.eventId}</p>
                    <p className="text-xs text-muted-foreground">{e._count.id} đơn hàng</p>
                  </div>
                  <p className="text-sm font-black text-primary shrink-0">
                    {Number(e._sum.total || 0).toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
