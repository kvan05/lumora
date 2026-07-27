"use client";

import { useState } from "react";
import { Megaphone, Plus, Search, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MOCK_CONTENT = [
  { id: "c1", title: "Điều khoản dịch vụ", slug: "/terms", type: "PAGE", status: "PUBLISHED", lastUpdated: "2026-05-10" },
  { id: "c2", title: "Chính sách bảo mật", slug: "/privacy", type: "PAGE", status: "PUBLISHED", lastUpdated: "2026-05-10" },
  { id: "c3", title: "Banner: Mùa lễ hội 2026", slug: "Trang chủ", type: "BANNER", status: "ACTIVE", lastUpdated: "2026-07-01" },
  { id: "c4", title: "Câu hỏi thường gặp (FAQ)", slug: "/faq", type: "PAGE", status: "DRAFT", lastUpdated: "2026-07-20" },
];

export default function ContentPage() {
  const handleDelete = () => {
    toast.success("Đã xóa nội dung.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý Nội dung 📝</h1>
          <p className="text-sm text-muted-foreground mt-1">Cấu hình các trang tĩnh, banner, điều khoản trên website.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2 h-9 text-sm">
            <Plus className="h-4 w-4" /> Thêm trang mới
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Tiêu đề</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Loại nội dung</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Cập nhật cuối</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CONTENT.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/20">
                <TableCell>
                  <p className="font-bold text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.slug}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{c.type === "PAGE" ? "Trang tĩnh" : "Banner quảng cáo"}</Badge>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "PUBLISHED" || c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                    {c.status === "PUBLISHED" ? "Đã xuất bản" : c.status === "ACTIVE" ? "Đang chạy" : "Bản nháp"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{c.lastUpdated}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-blue-500 hover:bg-blue-50">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
