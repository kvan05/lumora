"use client";

import { useState } from "react";
import { RefreshCw, Search, CheckCircle, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const MOCK_REFUNDS = [
  { id: "r1", orderId: "ORD-2026-001", buyer: "Nguyễn Văn An", event: "Marathon TP.HCM", reason: "Sự kiện bị hoãn", amount: 500000, status: "PENDING", date: "2026-07-20" },
  { id: "r2", orderId: "ORD-2026-005", buyer: "Vũ Hoàng Gia", event: "Food Festival Đà Nẵng", reason: "Mua nhầm vé", amount: 900000, status: "APPROVED", date: "2026-07-15" },
  { id: "r3", orderId: "ORD-2026-008", buyer: "Lê Thị C", event: "Tech Summit", reason: "Bận việc đột xuất", amount: 300000, status: "REJECTED", date: "2026-07-10" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Đã hoàn tiền", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Từ chối", className: "bg-red-100 text-red-700" },
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState(MOCK_REFUNDS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [note, setNote] = useState("");

  const filtered = refunds.filter(r => {
    const matchSearch = !search || r.orderId.toLowerCase().includes(search.toLowerCase()) || r.buyer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAction = (id: string, action: "APPROVED" | "REJECTED") => {
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    toast.success(action === "APPROVED" ? "Đã chấp nhận hoàn tiền" : "Đã từ chối hoàn tiền");
    setDetailOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Hoàn tiền & Khiếu nại 💸</h1>
        <p className="text-sm text-muted-foreground mt-1">Xử lý các yêu cầu hoàn tiền và khiếu nại từ khách hàng.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng yêu cầu", value: refunds.length, color: "text-foreground" },
          { label: "Chờ xử lý", value: refunds.filter(r => r.status === "PENDING").length, color: "text-yellow-500" },
          { label: "Đã hoàn", value: refunds.filter(r => r.status === "APPROVED").length, color: "text-emerald-500" },
          { label: "Từ chối", value: refunds.filter(r => r.status === "REJECTED").length, color: "text-red-500" },
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
            <Input placeholder="Tìm mã đơn, người mua..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 rounded-xl">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="PENDING">Chờ xử lý</SelectItem>
              <SelectItem value="APPROVED">Đã hoàn</SelectItem>
              <SelectItem value="REJECTED">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Mã đơn</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Khách hàng / Sự kiện</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Lý do</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Số tiền</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r.id} className="hover:bg-muted/20">
                <TableCell>
                  <p className="font-mono font-bold text-sm">{r.orderId}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{r.buyer}</p>
                  <p className="text-xs text-muted-foreground">{r.event}</p>
                </TableCell>
                <TableCell><span className="text-sm">{r.reason}</span></TableCell>
                <TableCell><span className="font-bold text-sm">{r.amount.toLocaleString("vi-VN")}₫</span></TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[r.status]?.className}`}>{STATUS_CONFIG[r.status]?.label}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => { setSelectedRefund(r); setDetailOpen(true); setNote(""); }}>
                      Chi tiết
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold">Xử lý hoàn tiền</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-4 rounded-xl">
                 <div className="col-span-2">
                   <p className="text-xs text-muted-foreground">Mã đơn / Khách hàng</p>
                   <p className="font-bold">{selectedRefund.orderId} - {selectedRefund.buyer}</p>
                 </div>
                 <div className="col-span-2">
                   <p className="text-xs text-muted-foreground">Sự kiện</p>
                   <p className="font-semibold">{selectedRefund.event}</p>
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground">Số tiền</p>
                   <p className="font-bold text-primary">{selectedRefund.amount.toLocaleString("vi-VN")}₫</p>
                 </div>
                  <div>
                   <p className="text-xs text-muted-foreground">Ngày yêu cầu</p>
                   <p className="font-semibold">{selectedRefund.date}</p>
                 </div>
                 <div className="col-span-2 mt-2">
                   <p className="text-xs text-muted-foreground">Lý do</p>
                   <p className="text-sm bg-background border p-2 rounded-lg mt-1">{selectedRefund.reason}</p>
                 </div>
              </div>

              {selectedRefund.status === "PENDING" && (
                <div className="space-y-2">
                    <label className="text-sm font-bold">Ghi chú xử lý</label>
                    <Textarea 
                      placeholder="Lý do từ chối hoặc ghi chú hoàn tiền..." 
                      className="rounded-xl resize-none" 
                      value={note} 
                      onChange={e => setNote(e.target.value)} 
                    />
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setDetailOpen(false)}>Đóng</Button>
                {selectedRefund.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl text-destructive border-destructive/30" onClick={() => handleAction(selectedRefund.id, "REJECTED")}>
                      Từ chối
                    </Button>
                    <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleAction(selectedRefund.id, "APPROVED")}>
                      Hoàn tiền
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
