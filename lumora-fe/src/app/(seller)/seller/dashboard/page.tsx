"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Ticket, Users, TrendingUp, ArrowUpRight, MapPin, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";

export default function SellerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, eventsRes] = await Promise.all([
          api.get("/seller/dashboard").catch(() => ({ data: { success: false } })),
          api.get("/seller/events").catch(() => ({ data: { success: false } })),
        ]);
        if (dashRes.data?.success && dashRes.data?.data) {
          setStats(dashRes.data.data.stats);
        }
        if (eventsRes.data?.success && eventsRes.data?.data) {
          setEvents(eventsRes.data.data.events || []);
        }
      } catch (error) {
        console.error("Seller dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[140px] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Tổng Doanh Thu",
      value: `${Number(stats?.totalRevenue || 0).toLocaleString("vi-VN")} ₫`,
      subtitle: "Từ các đơn hàng thành công",
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Vé Đã Bán",
      value: `+${stats?.totalOrders || 0}`,
      subtitle: "Tổng số vé được đặt",
      icon: Ticket,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Sự Kiện Đang Mở",
      value: stats?.publishedEvents || 0,
      subtitle: `Trên tổng số ${stats?.totalEvents || 0} sự kiện`,
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Khách Hàng",
      value: "Quản lý",
      subtitle: "Xem danh sách khách hàng",
      icon: Users,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
      link: "/seller/customers",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Tổng quan 🚀</h2>
          <p className="text-muted-foreground mt-1">
            Chào mừng trở lại, <span className="font-semibold text-primary">{session?.user?.name}</span>. Dưới đây là tình hình kinh doanh của bạn.
          </p>
        </div>
        <Button className="rounded-xl shadow-sm" asChild>
          <Link href="/seller/events/create">
            <Calendar className="mr-2 h-4 w-4" />
            Tạo sự kiện mới
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className={`h-16 w-16 ${stat.color}`} />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground mb-1">
                {stat.value}
              </div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                {stat.link ? (
                  <Link href={stat.link} className="flex items-center text-primary hover:underline">
                    {stat.subtitle} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </Link>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    {stat.subtitle}
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Events List and Revenue Chart */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Biểu đồ doanh thu</CardTitle>
              <CardDescription>
                Doanh thu tự động cập nhật từ các đơn hàng.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px] border-2 border-dashed border-border/60 rounded-xl m-6 mt-0 bg-muted/20">
            <div className="text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Theo dõi trực tiếp từ mục Tài chính</p>
              <Button variant="outline" size="sm" className="rounded-xl mt-2" asChild>
                <Link href="/seller/finance">Xem chi tiết doanh thu</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real Events List */}
        <Card className="col-span-1 lg:col-span-3 rounded-2xl border-border/50 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Sự kiện của bạn ({events.length})</CardTitle>
              <CardDescription>
                Danh sách sự kiện mới nhất đang hoạt động.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary rounded-xl" asChild>
              <Link href="/seller/events">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-2">
            {events.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground space-y-3">
                <p>Bạn chưa tạo sự kiện nào.</p>
                <Button size="sm" className="rounded-xl" asChild>
                  <Link href="/seller/events/create">Tạo sự kiện ngay</Link>
                </Button>
              </div>
            ) : (
              events.slice(0, 5).map((evt: any) => (
                <div 
                  key={evt.id} 
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/40 transition-colors gap-3"
                >
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {evt.bannerUrl ? (
                      <Image src={evt.bannerUrl} alt={evt.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                        {evt.title.substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold truncate text-foreground">{evt.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {evt.city}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(evt.startDate), "dd/MM/yyyy", { locale: vi })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={evt.status === "PUBLISHED" ? "default" : "secondary"} className="text-[10px] py-0 px-2 rounded-full">
                      {evt.status === "PUBLISHED" ? "Đã đăng" : evt.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                      <Link href={`/events/${evt.slug || evt.id}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

