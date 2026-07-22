"use client";

import { useState } from "react";
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
  ExternalLink,
  User,
  AlertCircle
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Chờ thanh toán", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30", icon: Clock },
  CONFIRMED: { label: "Đã thanh toán", color: "bg-green-100 text-green-700 dark:bg-green-900/30", icon: CheckCircle2 },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700 dark:bg-red-900/30", icon: XCircle },
};

export default function SellerOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: async () => {
      const res = await api.get("/seller/orders");
      return res.data.data.orders;
    },
  });

  const filteredOrders = data?.filter((order: any) =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Quản lý Đơn hàng</h2>
        <p className="text-muted-foreground mt-1">
          Theo dõi tất cả đơn hàng đã được đặt cho các sự kiện của bạn.
        </p>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm theo mã đơn, khách hàng hoặc tên sự kiện..." 
              className="pl-9 h-10 rounded-xl bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-semibold text-muted-foreground">
            Hiển thị {filteredOrders?.length || 0} kết quả
          </div>
        </div>

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
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Chi tiết</TableHead>
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
              ) : filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 opacity-50" />
                      <p>Không tìm thấy đơn hàng nào phù hợp.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order: any) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100", icon: Ticket };
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <TableRow key={order.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs uppercase font-medium">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
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
                        {Number(order.totalAmount).toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${statusInfo.color} border-none font-semibold shadow-none`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" asChild>
                          <Link href={`#`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
