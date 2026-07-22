"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw 
} from "lucide-react";

export default function OrderHistoryPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const limit = 6;

  const { data, isLoading, refetch, isPlaceholderData } = useQuery({
    queryKey: ["my-orders", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      const res = await api.get(`/orders?${params.toString()}`);
      return res.data.data;
    },
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || { totalPages: 1 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            Chờ thanh toán
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Đã xác nhận
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <XCircle className="h-3 w-3 shrink-0" />
            Đã hủy
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge className="bg-purple-100 hover:bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <RefreshCw className="h-3 w-3 shrink-0" />
            Đã hoàn tiền
          </Badge>
        );
      case "CHECKED_IN":
        return (
          <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Đã tham gia
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1); // Reset to page 1 on filter change
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="h-8 w-8 text-primary" /> Vé của tôi
          </h1>
          <p className="text-muted-foreground mt-2">
            Xem lịch sử đặt vé và thông tin vé điện tử của bạn.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("")}
            className="rounded-full"
          >
            Tất cả
          </Button>
          <Button
            variant={statusFilter === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("PENDING")}
            className="rounded-full"
          >
            Chờ thanh toán
          </Button>
          <Button
            variant={statusFilter === "CONFIRMED" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("CONFIRMED")}
            className="rounded-full"
          >
            Đã thanh toán
          </Button>
          <Button
            variant={statusFilter === "CANCELLED" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("CANCELLED")}
            className="rounded-full"
          >
            Đã hủy
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden border border-border/50">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                <Skeleton className="h-32 w-full md:w-48 rounded-lg shrink-0" />
                <div className="flex-1 space-y-4 py-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-2 border-dashed border-border/50 p-16 text-center bg-card/30 backdrop-blur rounded-2xl">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag className="h-10 w-10 opacity-60" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Không tìm thấy vé nào</h3>
              <p className="text-muted-foreground text-sm">
                Bạn chưa đặt vé hoặc không có vé nào khớp với trạng thái tìm kiếm này.
              </p>
            </div>
            <Button className="rounded-full px-6" asChild>
              <Link href="/events">Khám phá sự kiện</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6">
            {orders.map((order: any) => {
              const eventDate = new Date(order.event.startDate);
              const itemsCount = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
              
              return (
                <Card 
                  key={order.id} 
                  className="overflow-hidden border border-border/60 hover:shadow-md transition-all group bg-card/60 backdrop-blur rounded-2xl"
                >
                  <div className="flex flex-col md:flex-row gap-6 p-6">
                    {/* Event Image */}
                    <div className="relative h-32 w-full md:w-48 bg-muted rounded-xl overflow-hidden shrink-0">
                      {order.event.bannerUrl ? (
                        <Image
                          src={order.event.bannerUrl}
                          alt={order.event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {order.event.title.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 flex flex-col justify-between py-1 space-y-4 md:space-y-0">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                            {order.orderNumber}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <h3 className="font-extrabold text-xl group-hover:text-primary transition-colors line-clamp-1">
                          {order.event.title}
                        </h3>
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-secondary-foreground/60" />
                            <span>{format(eventDate, "EEEE, d MMMM, yyyy 'lúc' HH:mm", { locale: vi })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-secondary-foreground/60" />
                            <span className="line-clamp-1">{order.event.venue}, {order.event.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4 md:border-t-0 md:pt-0">
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground block text-xs">Số lượng</span>
                            <span className="font-bold text-foreground">{itemsCount} vé</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Tổng tiền</span>
                            <span className="font-bold text-primary">
                              {Number(order.total).toLocaleString("vi-VN")} ₫
                            </span>
                          </div>
                        </div>

                        <Button size="sm" className="rounded-full shadow-sm" asChild>
                          {order.status === "PENDING" ? (
                            <Link href={`/checkout/${order.id}`}>
                              Thanh toán ngay
                            </Link>
                          ) : (
                            <Link href={`/orders/${order.id}`}>
                              Chi tiết vé <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isPlaceholderData}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Trang {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages || isPlaceholderData}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
