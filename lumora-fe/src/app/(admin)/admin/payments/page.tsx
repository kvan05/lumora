"use client";

import { useState } from "react";
import { CreditCard, Search, CheckCircle2, XCircle, RefreshCw, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const MOCK_PAYMENTS = [
  { id: "p1", orderId: "ORD-2026-001", buyer: "Nguyễn Văn An", event: "Live Concert Sky Dec", amount: 2400000, platformFee: 120000, organizerNet: 2280000, method: "PayOS", status: "SUCCEEDED", paidAt: "2026-07-15 10:35:22" },
  { id: "p2", orderId: "ORD-2026-002", buyer: "Trần Thị Bích", event: "Workshop Kỹ năng mềm", amount: 350000, platformFee: 17500, organizerNet: 332500, method: "PayOS", status: "PENDING", paidAt: null },
  { id: "p3", orderId: "ORD-2026-003", buyer: "Lê Minh Cường", event: "Marathon TP.HCM", amount: 500000, platformFee: 25000, organizerNet: 475000, method: "PayOS", status: "FAILED", paidAt: null },
  { id: "p4", orderId: "ORD-2026-004", buyer: "Phạm Thị Dung", event: "Hà Anh Tuấn Concert", amount: 6000000, platformFee: 300000, organizerNet: 5700000, method: "PayOS", status: "SUCCEEDED", paidAt: "2026-07-14 11:10:00" },
  { id: "p5", orderId: "ORD-2026-005", buyer: "Vũ Hoàng Gia", event: "Food Festival Đà Nẵng", amount: 900000, platformFee: 45000, organizerNet: 855000, method: "PayOS", status: "REFUNDED", paidAt: "2026-07-13 16:50:00" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Chờ thanh toán", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  SUCCEEDED: { label: "Thành công", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  FAILED: { label: "Thất bại", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  REFUNDED: { label: "Đã hoàn tiền", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = payments.filter(p => {
    const matchSearch = !search || p.orderId.toLowerCase().includes(search.toLowerCase()) || p.buyer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = payments.filter(p => p.status === "SUCCEEDED").reduce((sum, p) => sum + p.amount, 0);
  const totalFees = payments.filter(p => p.status === "SUCCEEDED").reduce((sum, p) => sum + p.platformFee, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Quản lý thanh toán 💳</h1>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi tất cả giao dịch thanh toán trên hệ thống.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng giao dịch", value: payments.length, color: "text-foreground" },
          { label: "Thành công", value: payments.filter(p => p.status === "SUCCEEDED").length, color: "text-emerald-500" },
          { label: "Doanh thu thu", value: `${(totalRevenue / 1000000).toFixed(1)}M ₫`, color: "text-blue-500" },
          { label: "Phí nền tảng", value: `${(totalFees / 1000).toFixed(0)}K ₫`, color: "text-purple-500" },
        ].map(s => (
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
            <Input placeholder="Tìm theo mã đơn, người mua..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="PENDING">Chờ TT</SelectItem>
              <SelectItem value="SUCCEEDED">Thành công</SelectItem>
              <SelectItem value="FAILED">Thất bại</SelectItem>
              <SelectItem value="REFUNDED">Hoàn tiền</SelectItem>
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
              <TableHead className="font-bold text-xs uppercase tracking-wider">Số tiền</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Phí sàn</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden lg:table-cell">NTC nhận</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden lg:table-cell">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-muted/20">
                <TableCell>
                  <p className="font-mono font-bold text-sm">{p.orderId}</p>
                  <p className="text-xs text-muted-foreground">{p.method}</p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <p className="text-sm">{p.buyer}</p>
                  <p className="text-xs text-muted-foreground">{p.event}</p>
                </TableCell>
                <TableCell><span className="font-bold text-sm">{p.amount.toLocaleString("vi-VN")}₫</span></TableCell>
                <TableCell className="hidden md:table-cell"><span className="text-sm text-primary font-medium">{p.platformFee.toLocaleString("vi-VN")}₫</span></TableCell>
                <TableCell className="hidden lg:table-cell"><span className="text-sm">{p.organizerNet.toLocaleString("vi-VN")}₫</span></TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[p.status]?.className}`}>{STATUS_CONFIG[p.status]?.label}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <p className="text-xs text-muted-foreground">{p.paidAt || "–"}</p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
