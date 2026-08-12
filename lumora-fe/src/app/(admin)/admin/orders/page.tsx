"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShoppingCart, Search, Eye, RefreshCw, CheckCircle2, Ticket, XCircle, CreditCard, ShieldCheck, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EventTicket } from "@/components/ticket/EventTicket";

export default function AdminOrdersAndPaymentsPage() {
  const [search, setSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch real Orders & Payments from Backend API
  const { data: ordersData, isLoading: isLoadingOrders, refetch: refetchOrders, isFetching } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await api.get("/admin/orders");
      return res.data.success ? res.data.data : [];
    },
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const res = await api.get("/admin/payments");
      return res.data.success ? res.data.data : [];
    },
  });

  const orders = Array.isArray(ordersData) ? ordersData : [];
  const payments = Array.isArray(paymentsData) ? paymentsData : [];

  // Map payments to orders for easy lookup
  const paymentMap = new Map();
  payments.forEach((p: any) => {
    paymentMap.set(p.orderId, p);
  });

  const filteredOrders = orders.filter((o: any) => {
    const buyerName = o.buyer?.name || o.buyer?.email || "";
    const eventTitle = o.event?.title || "";
    const orderNumber = o.orderNumber || "";

    const matchSearch =
      !search ||
      orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      buyerName.toLowerCase().includes(search.toLowerCase()) ||
      eventTitle.toLowerCase().includes(search.toLowerCase());

    const matchOrderStatus = orderStatusFilter === "ALL" || o.status === orderStatusFilter;
    const payment = paymentMap.get(o.id);
    const pStatus = payment?.status || (["CONFIRMED", "PAID"].includes(o.status) ? "SUCCEEDED" : o.status);
    const matchPaymentStatus = paymentStatusFilter === "ALL" || pStatus === paymentStatusFilter;

    return matchSearch && matchOrderStatus && matchPaymentStatus;
  });

  const totalGMV = orders.filter((o: any) => ["CONFIRMED", "PAID"].includes(o.status)).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  const platformFee = totalGMV * 0.05; // 5% platform fee
  const sellerRevenue = totalGMV * 0.95; // 95% seller revenue
  const pendingCount = orders.filter((o: any) => o.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" /> Quản Lý Đơn Hàng & Thanh Toán
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Module quản lý hợp nhất tất cả đơn hàng, giao dịch PayOS VietQR, phí sàn 5% và doanh thu Seller.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 h-10 border-border/60"
          onClick={() => refetchOrders()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Real Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase">Tổng Đơn Hàng</p>
            <p className="text-2xl font-black text-foreground mt-1">{orders.length}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Đơn Chờ Thanh Toán</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Tổng Doanh Thu Sàn (GMV)</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {totalGMV.toLocaleString("vi-VN")} ₫
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-primary font-semibold uppercase">Phí Sàn Thu Được (5%)</p>
            <p className="text-xl font-black text-primary mt-1">
              {platformFee.toLocaleString("vi-VN")} ₫
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Mã đơn (ORD-x), Tên người mua, Tên sự kiện..."
              className="pl-9 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
              <SelectValue placeholder="Trạng thái đơn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả đơn hàng</SelectItem>
              <SelectItem value="CONFIRMED">Đã xác nhận (CONFIRMED)</SelectItem>
              <SelectItem value="PENDING">Chờ thanh toán (PENDING)</SelectItem>
              <SelectItem value="REFUNDED">Đã hoàn tiền (REFUNDED)</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy (CANCELLED)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
              <SelectValue placeholder="Trạng thái PayOS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả thanh toán</SelectItem>
              <SelectItem value="SUCCEEDED">Thành công (SUCCEEDED)</SelectItem>
              <SelectItem value="PENDING">Chờ chuyển khoản</SelectItem>
              <SelectItem value="REFUNDED">Đã hoàn lại tiền</SelectItem>
              <SelectItem value="FAILED">Thất bại</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs overflow-hidden">
        {isLoadingOrders ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-base font-bold text-foreground">Không tìm thấy đơn hàng nào</p>
            <p className="text-xs text-muted-foreground mt-1">Dữ liệu đơn hàng thực tế từ cơ sở dữ liệu Neon đang trống hoặc không khớp bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Mã đơn hàng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Người mua (Buyer)</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Sự kiện</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Tổng tiền</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Phí sàn (5%)</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Doanh thu Seller</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Cổng Thanh Toán</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((o: any) => {
                  const payment = paymentMap.get(o.id);
                  const total = Number(o.total || 0);
                  const fee = total * 0.05;
                  const sellerRev = total * 0.95;

                  return (
                    <TableRow key={o.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {o.orderNumber}
                        <p className="text-[10px] text-muted-foreground font-normal">
                          {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </TableCell>

                      <TableCell>
                        <p className="font-semibold text-sm">{o.buyer?.name || "Khách hàng"}</p>
                        <p className="text-xs text-muted-foreground">{o.buyer?.email}</p>
                      </TableCell>

                      <TableCell className="max-w-[180px]">
                        <p className="font-bold text-sm truncate">{o.event?.title || "Sự kiện Lumora"}</p>
                      </TableCell>

                      <TableCell className="text-right font-black text-sm">
                        {total.toLocaleString("vi-VN")} ₫
                      </TableCell>

                      <TableCell className="text-right text-xs font-bold text-primary">
                        {fee.toLocaleString("vi-VN")} ₫
                      </TableCell>

                      <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {sellerRev.toLocaleString("vi-VN")} ₫
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>PayOS VietQR</span>
                        </div>
                        {payment?.payosOrderCode && (
                          <p className="text-[10px] text-muted-foreground font-mono">Code: {payment.payosOrderCode.toString()}</p>
                        )}
                      </TableCell>

                      <TableCell>
                        {o.status === "CONFIRMED" || o.status === "PAID" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            ✓ Đã thanh toán
                          </Badge>
                        ) : o.status === "REFUNDED" ? (
                          <Badge variant="destructive">Đã hoàn tiền</Badge>
                        ) : o.status === "CANCELLED" ? (
                          <Badge variant="outline" className="text-red-500 border-red-500/30">
                            Đã hủy
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Chờ chuyển khoản
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-xl"
                          onClick={() => setSelectedOrder(o)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Order & Payment Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Chi Tiết Đơn Hàng #{selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thông tin giao dịch từ CSDL PostgreSQL Neon và cổng PayOS.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-muted/30 p-2.5 rounded-xl border">
                  <p className="text-muted-foreground font-semibold">Khách Hàng (Buyer)</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedOrder.buyer?.name || "N/A"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{selectedOrder.buyer?.email}</p>
                </div>

                <div className="bg-muted/30 p-2.5 rounded-xl border">
                  <p className="text-muted-foreground font-semibold">Sự Kiện</p>
                  <p className="font-bold text-foreground mt-0.5 truncate">{selectedOrder.event?.title}</p>
                </div>

                <div className="bg-muted/30 p-2.5 rounded-xl border">
                  <p className="text-muted-foreground font-semibold">Trạng Thái Đơn</p>
                  <p className="font-bold text-primary mt-0.5">{selectedOrder.status}</p>
                </div>

                <div className="bg-muted/30 p-2.5 rounded-xl border">
                  <p className="text-muted-foreground font-semibold">Thời Gian Tạo</p>
                  <p className="font-bold text-foreground mt-0.5">{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-muted/20 border rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between font-medium">
                  <span>Tổng tiền thanh toán (GMV)</span>
                  <span className="font-bold text-sm">{Number(selectedOrder.total || 0).toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Phí sàn thu được (5%)</span>
                  <span className="font-bold">+ {(Number(selectedOrder.total || 0) * 0.05).toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Doanh thu Seller nhận được (95%)</span>
                  <span className="font-bold">{(Number(selectedOrder.total || 0) * 0.95).toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>

              <Separator />

              {/* Barcode Tickets in this Order */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-primary" /> Vé Mã Vạch Đã Cấp Phát
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any) => (
                    <EventTicket
                      key={item.id}
                      ticketCode={item.ticketCode || `TKT-${item.id.slice(-8).toUpperCase()}`}
                      eventTitle={selectedOrder.event?.title || "Sự kiện Lumora"}
                      bannerUrl={selectedOrder.event?.bannerUrl}
                      category={selectedOrder.event?.category || "Sự kiện"}
                      ticketType={item.ticketType?.name || (item.seat ? `Ghế ${item.seat.seatLabel}` : "Vé Sự Kiện")}
                      startDate={selectedOrder.event?.startDate || new Date()}
                      venue={selectedOrder.event?.venue || "Địa điểm Lumora"}
                      city={selectedOrder.event?.city || "Việt Nam"}
                      status={selectedOrder.status}
                      isCheckedIn={item.isCheckedIn}
                      holderName={selectedOrder.buyer?.name || selectedOrder.buyer?.email}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
