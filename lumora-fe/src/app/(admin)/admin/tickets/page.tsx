"use client";

import { useState } from "react";
import { Ticket, Search, Ban, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const MOCK_TICKETS = [
  { id: "t1", event: "Live Concert Sky Dec", name: "VIP", price: 2000000, quantity: 100, sold: 75, saleStart: "2026-07-01", saleEnd: "2026-08-14", status: "ACTIVE" },
  { id: "t2", event: "Live Concert Sky Dec", name: "Regular", price: 800000, quantity: 500, sold: 380, saleStart: "2026-07-01", saleEnd: "2026-08-14", status: "ACTIVE" },
  { id: "t3", event: "Workshop Kỹ năng mềm", name: "Standard", price: 350000, quantity: 80, sold: 80, saleStart: "2026-07-10", saleEnd: "2026-07-25", status: "SOLD_OUT" },
  { id: "t4", event: "Hà Anh Tuấn Concert", name: "Premium", price: 1500000, quantity: 200, sold: 140, saleStart: "2026-08-01", saleEnd: "2026-10-04", status: "ACTIVE" },
  { id: "t5", event: "Marathon TP.HCM", name: "Runner", price: 500000, quantity: 300, sold: 50, saleStart: "2026-07-01", saleEnd: "2026-11-14", status: "PAUSED" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Còn bán", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  SOLD_OUT: { label: "Hết vé", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  PAUSED: { label: "Ngừng bán", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  EXPIRED: { label: "Hết hạn", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.event.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (ticketId: string, status: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    const msgs: Record<string, string> = { ACTIVE: "Đã mở bán vé", PAUSED: "Đã ngừng bán vé", SOLD_OUT: "Đã đánh dấu hết vé" };
    toast.success(msgs[status] || "Đã cập nhật trạng thái vé");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý vé 🎟️</h1>
          <p className="text-sm text-muted-foreground mt-1">Kiểm duyệt và quản lý tất cả loại vé trên hệ thống.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng loại vé", value: tickets.length, color: "text-foreground" },
          { label: "Đang bán", value: tickets.filter(t => t.status === "ACTIVE").length, color: "text-emerald-500" },
          { label: "Hết vé", value: tickets.filter(t => t.status === "SOLD_OUT").length, color: "text-red-500" },
          { label: "Ngừng bán", value: tickets.filter(t => t.status === "PAUSED").length, color: "text-orange-500" },
        ].map(s => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo sự kiện hoặc tên vé..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 rounded-xl">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="ACTIVE">Còn bán</SelectItem>
              <SelectItem value="SOLD_OUT">Hết vé</SelectItem>
              <SelectItem value="PAUSED">Ngừng bán</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Sự kiện / Loại vé</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Giá vé</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Số lượng</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden lg:table-cell">Thời gian bán</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Điều chỉnh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(ticket => (
              <TableRow key={ticket.id} className="hover:bg-muted/20">
                <TableCell>
                  <p className="font-semibold text-sm">{ticket.event}</p>
                  <p className="text-xs text-muted-foreground">{ticket.name}</p>
                </TableCell>
                <TableCell>
                  <p className="font-bold text-sm">{ticket.price.toLocaleString("vi-VN")}₫</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">
                    <span className="font-semibold">{ticket.sold}</span>
                    <span className="text-muted-foreground">/{ticket.quantity}</span>
                  </div>
                  <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (ticket.sold / ticket.quantity) * 100)}%` }} />
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <p className="text-xs text-muted-foreground">{ticket.saleStart} → {ticket.saleEnd}</p>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[ticket.status]?.className}`}>
                    {STATUS_CONFIG[ticket.status]?.label}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    {ticket.status !== "ACTIVE" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusChange(ticket.id, "ACTIVE")}>
                        Mở bán
                      </Button>
                    )}
                    {ticket.status === "ACTIVE" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-lg text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleStatusChange(ticket.id, "PAUSED")}>
                        Ngừng bán
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
