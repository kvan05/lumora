"use client";

import { useState } from "react";
import { Tag, Plus, Search, Edit2, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOCK_PROMOS = [
  { id: "p1", code: "SUMMER26", type: "PERCENTAGE", value: 10, maxDiscount: 50000, minOrder: 200000, usageLimit: 100, usedCount: 45, startDate: "2026-06-01", endDate: "2026-08-31", status: "ACTIVE" },
  { id: "p2", code: "WELCOME", type: "FIXED", value: 20000, maxDiscount: 20000, minOrder: 100000, usageLimit: 500, usedCount: 500, startDate: "2026-01-01", endDate: "2026-12-31", status: "EXHAUSTED" },
  { id: "p3", code: "FLASH50", type: "PERCENTAGE", value: 50, maxDiscount: 100000, minOrder: 300000, usageLimit: 50, usedCount: 12, startDate: "2026-07-20", endDate: "2026-07-22", status: "EXPIRED" },
];

export default function PromotionsPage() {
  const [promos, setPromos] = useState(MOCK_PROMOS);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const filtered = promos.filter(p => p.code.toLowerCase().includes(search.toLowerCase()));

  const handleOpenAdd = () => {
    setDialogOpen(true);
  };

  const handleSave = () => {
    toast.success("Đã lưu khuyến mãi.");
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Xóa mã khuyến mãi này?")) return;
    setPromos(prev => prev.filter(p => p.id !== id));
    toast.success("Đã xóa mã khuyến mãi.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý Khuyến mãi 🎁</h1>
          <p className="text-sm text-muted-foreground mt-1">Tạo và quản lý các mã giảm giá cho toàn sàn.</p>
        </div>
        <Button className="rounded-xl gap-2 h-9" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" /> Tạo mã giảm giá
        </Button>
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm mã khuyến mãi..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Mã / Loại</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Mức giảm</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Lượt dùng</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Thời gian áp dụng</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm font-mono px-2 py-0.5 bg-primary/10 text-primary rounded-md">{p.code}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Đơn tối thiểu: {p.minOrder.toLocaleString("vi-VN")}₫</p>
                </TableCell>
                <TableCell>
                  <p className="font-bold text-sm text-emerald-600">
                    {p.type === "PERCENTAGE" ? `${p.value}%` : `${p.value.toLocaleString("vi-VN")}₫`}
                  </p>
                  {p.type === "PERCENTAGE" && <p className="text-[10px] text-muted-foreground">Tối đa {p.maxDiscount.toLocaleString("vi-VN")}₫</p>}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="font-semibold">{p.usedCount}</span> / <span>{p.usageLimit}</span>
                  </div>
                  <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (p.usedCount / p.usageLimit) * 100)}%` }} />
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-xs">{p.startDate}</p>
                  <p className="text-xs text-muted-foreground">đến {p.endDate}</p>
                </TableCell>
                <TableCell>
                  {p.status === "ACTIVE" && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Đang chạy</span>}
                  {p.status === "EXHAUSTED" && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Hết lượt</span>}
                  {p.status === "EXPIRED" && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">Hết hạn</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold">Tạo mã giảm giá</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Mã Voucher (Code)</Label>
              <Input placeholder="VD: SALE2026" className="rounded-xl font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Loại giảm giá</Label>
                <Select defaultValue="PERCENTAGE">
                  <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
                    <SelectItem value="FIXED">Số tiền cố định (VND)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mức giảm</Label>
                <Input type="number" placeholder="10" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Giảm tối đa (VND)</Label>
              <Input type="number" placeholder="50000" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Đơn tối thiểu (VND)</Label>
                <Input type="number" placeholder="100000" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Giới hạn sử dụng</Label>
                <Input type="number" placeholder="100" className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button className="rounded-xl" onClick={handleSave}>Tạo mã</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
