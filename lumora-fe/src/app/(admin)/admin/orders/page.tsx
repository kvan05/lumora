"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Search, Eye, X, RefreshCw, Download, Clock, CheckCircle2, Ticket, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/api";
import { EventTicket } from "@/components/ticket/EventTicket";

const MOCK_ORDERS = [
  { id: "o1", orderNumber: "ORD-2026-001", buyer: "Nguyễn Văn An", buyerEmail: "vanan@gmail.com", event: "Live Concert Sky Dec", ticketType: "VIP", quantity: 2, amount: 2400000, status: "CONFIRMED", paymentMethod: "PayOS", createdAt: "2026-07-15 10:30:00" },
  { id: "o2", orderNumber: "ORD-2026-002", buyer: "Trần Thị Bích", buyerEmail: "tbich@gmail.com", event: "Workshop Kỹ năng mềm", ticketType: "Standard", quantity: 1, amount: 350000, status: "PENDING", paymentMethod: "PayOS", createdAt: "2026-07-15 09:15:00" },
  { id: "o3", orderNumber: "ORD-2026-003", buyer: "Lê Minh Cường", buyerEmail: "mcuong@gmail.com", event: "Marathon TP.HCM", ticketType: "Regular", quantity: 1, amount: 500000, status: "CANCELLED", paymentMethod: "PayOS", createdAt: "2026-07-14 14:20:00" },
  { id: "o4", orderNumber: "ORD-2026-004", buyer: "Phạm Thị Dung", buyerEmail: "tdung@gmail.com", event: "Hà Anh Tuấn Concert", ticketType: "Premium", quantity: 4, amount: 6000000, status: "CONFIRMED", paymentMethod: "PayOS", createdAt: "2026-07-14 11:05:00" },
  { id: "o5", orderNumber: "ORD-2026-005", buyer: "Vũ Hoàng Gia", buyerEmail: "hgia@gmail.com", event: "Food Festival Đà Nẵng", ticketType: "Standard", quantity: 3, amount: 900000, status: "REFUNDED", paymentMethod: "PayOS", createdAt: "2026-07-13 16:45:00" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  PENDING: { label: "Chờ thanh toán", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  CONFIRMED: { label: "Đã thanh toán", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  ISSUED: { label: "Đã phát hành vé", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Ticket },
  USED: { label: "Đã sử dụng", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle2 },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: X },
  REFUNDED: { label: "Đã hoàn tiền", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: RefreshCw },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>(MOCK_ORDERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders").catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        const normalized = res.data.data.map((o: any) => ({
          ...o,
          buyerName: typeof o.buyer === "object" ? (o.buyer?.name || o.buyer?.email || "N/A") : (o.buyer || "N/A"),
          buyerEmail: typeof o.buyer === "object" ? o.buyer?.email : (o.buyerEmail || ""),
          eventTitle: typeof o.event === "object" ? o.event?.title : (o.event || "N/A"),
          ticketType: o.items?.[0]?.ticketType?.name || o.items?.[0]?.seat?.seatLabel || o.ticketType || "Vé",
          quantity: o.items ? o.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : (o.quantity || 1),
          amount: Number(o.total || o.amount || 0),
          createdAtStr: typeof o.createdAt === "string" ? o.createdAt.split("T")[0] : "",
        }));
        setOrders(normalized);
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, []);

  const filtered = orders.filter(o => {
    const buyerStr = (o.buyerName || "").toLowerCase();
    const eventStr = (o.eventTitle || "").toLowerCase();
    const searchLower = search.toLowerCase();
    const matchSearch = !search || o.orderNumber?.toLowerCase().includes(searchLower) || buyerStr.includes(searchLower) || eventStr.includes(searchLower);
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, { status: "CANCELLED" }).catch(() => null);
      if (res?.data?.success) {
        toast.success(res.data.message); loadOrders();
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
        toast.success("Đã hủy đơn hàng.");
      }
    } catch { toast.error("Có lỗi xảy ra."); }
  };

  const totalRevenue = orders.filter(o => o.status === "CONFIRMED").reduce((sum, o) => sum + (o.amount || 0), 0);
  const pendingCount = orders.filter(o => o.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý đơn mua vé 🛒</h1>
          <p className="text-sm text-muted-foreground mt-1">Theo dõi và xử lý tất cả đơn đặt vé trên hệ thống.</p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2 h-9 text-sm" onClick={loadOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng đơn", value: orders.length, color: "text-foreground" },
          { label: "Chờ thanh toán", value: pendingCount, color: "text-yellow-500" },
          { label: "Đã xác nhận", value: orders.filter(o => o.status === "CONFIRMED").length, color: "text-emerald-500" },
          { label: "Doanh thu (TT)", value: `${(totalRevenue / 1000000).toFixed(1)}M ₫`, color: "text-blue-500" },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo mã đơn, người mua, sự kiện..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9 rounded-xl">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ thanh toán</SelectItem>
              <SelectItem value="CONFIRMED">Đã thanh toán</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Mã đơn</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Người mua</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Sự kiện</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden lg:table-cell">Số vé</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Tổng tiền</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Không tìm thấy đơn hàng nào.</TableCell></TableRow>
            ) : filtered.map((order) => {
              const conf = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              return (
                <TableRow key={order.id} className="hover:bg-muted/20">
                  <TableCell>
                    <p className="font-mono text-sm font-bold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.createdAtStr || (typeof order.createdAt === "string" ? order.createdAt.split("T")[0] : "")}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-sm font-medium">{order.buyerName || order.buyer}</p>
                    <p className="text-xs text-muted-foreground">{order.buyerEmail}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm">{order.eventTitle || order.event}</p>
                    <p className="text-xs text-muted-foreground">{order.ticketType}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm font-semibold">{order.quantity}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold">{order.amount.toLocaleString("vi-VN")}₫</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conf.className}`}>{conf.label}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === "PENDING" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleCancelOrder(order.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> Chi tiết đơn hàng #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  { label: "Mã đơn", value: selectedOrder.orderNumber },
                  { label: "Người mua", value: selectedOrder.buyerName || selectedOrder.buyer },
                  { label: "Email", value: selectedOrder.buyerEmail || "N/A" },
                  { label: "Sự kiện", value: selectedOrder.eventTitle || selectedOrder.event },
                  { label: "Loại vé", value: selectedOrder.ticketType },
                  { label: "Số lượng", value: `${selectedOrder.quantity} vé` },
                  { label: "Phương thức TT", value: selectedOrder.paymentMethod || "PayOS" },
                  { label: "Thời gian", value: selectedOrder.createdAtStr || selectedOrder.createdAt },
                ].map(item => (
                  <div key={item.label} className="bg-muted/30 rounded-xl p-2.5">
                    <p className="text-[11px] text-muted-foreground font-medium">{item.label}</p>
                    <p className="font-semibold mt-0.5 text-xs truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 rounded-xl p-3 flex justify-between items-center border border-primary/10">
                <span className="font-bold text-sm">Tổng tiền thanh toán</span>
                <span className="text-xl font-black text-primary">{selectedOrder.amount.toLocaleString("vi-VN")} ₫</span>
              </div>

              <Separator />

              {/* Phôi vé Barcode preview */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-primary" /> Phôi vé Điện tử có Mã Vạch (Barcode)
                </h4>
                <div className="space-y-4">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any) => (
                      <EventTicket
                        key={item.id}
                        ticketCode={item.ticketCode || `TKT-${item.id.slice(-8).toUpperCase()}`}
                        eventTitle={selectedOrder.eventTitle || selectedOrder.event}
                        bannerUrl={selectedOrder.event?.bannerUrl}
                        category={selectedOrder.event?.category || "Sự kiện"}
                        ticketType={item.ticketType?.name || selectedOrder.ticketType}
                        startDate={selectedOrder.event?.startDate || new Date()}
                        venue={selectedOrder.event?.venue || "Địa điểm Lumora"}
                        city={selectedOrder.event?.city || "Việt Nam"}
                        status={selectedOrder.status}
                        isCheckedIn={item.isCheckedIn}
                      />
                    ))
                  ) : (
                    <EventTicket
                      ticketCode={selectedOrder.orderNumber ? `TKT-${selectedOrder.orderNumber}` : "LM20268888"}
                      eventTitle={selectedOrder.eventTitle || selectedOrder.event || "Sự kiện Lumora"}
                      category="Sự kiện"
                      ticketType={selectedOrder.ticketType || "Vé Tiêu Chuẩn"}
                      startDate={new Date()}
                      venue="Trung tâm Hội nghị Lumora"
                      city="TP. Hồ Chí Minh"
                      status={selectedOrder.status === "CONFIRMED" ? "CONFIRMED" : selectedOrder.status}
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t">
                <div className="flex gap-2">
                  {selectedOrder.status === "PENDING" && (
                    <Button variant="outline" className="rounded-xl text-destructive border-destructive/30" onClick={() => { handleCancelOrder(selectedOrder.id); setDetailOpen(false); }}>
                      Hủy đơn
                    </Button>
                  )}
                </div>
                <Button className="rounded-xl font-bold" onClick={() => setDetailOpen(false)}>Đóng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
