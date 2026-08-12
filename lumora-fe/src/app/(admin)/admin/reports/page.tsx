"use client";

import { useState } from "react";
import { Flag, AlertTriangle, ShieldAlert, CheckCircle, Ban, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const MOCK_REPORTS = [
  { id: "rp1", targetType: "EVENT", targetName: "Concert BlackPink VN", reporter: "user123", reason: "Sự kiện có dấu hiệu lừa đảo, không có thật.", status: "PENDING", date: "2026-07-22" },
  { id: "rp2", targetType: "USER", targetName: "seller_fake_99", reporter: "buyer_01", reason: "Nhà tổ chức nhắn tin lừa đảo nạp tiền ngoài hệ thống.", status: "RESOLVED", date: "2026-07-20" },
  { id: "rp3", targetType: "REVIEW", targetName: "Đánh giá của tuan_anh", reporter: "organizer_hn", reason: "Spam chửi bới vô cớ, dùng từ ngữ thô tục.", status: "REJECTED", date: "2026-07-15" },
];

export default function ReportsPage() {
  const [reports, setReports] = useState(MOCK_REPORTS);

  const handleAction = (id: string, action: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    toast.success(action === "RESOLVED" ? "Đã xử lý vi phạm." : "Đã bỏ qua báo cáo.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Báo cáo vi phạm</h1>
          <p className="text-sm text-muted-foreground mt-1">Xử lý các báo cáo từ cộng đồng về sự kiện, người dùng, đánh giá vi phạm.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng báo cáo", value: reports.length, color: "text-foreground" },
          { label: "Chờ xử lý", value: reports.filter(r => r.status === "PENDING").length, color: "text-yellow-500" },
          { label: "Đã xử lý (Khóa/Gỡ)", value: reports.filter(r => r.status === "RESOLVED").length, color: "text-emerald-500" },
          { label: "Báo cáo giả", value: reports.filter(r => r.status === "REJECTED").length, color: "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Đối tượng bị báo cáo</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Lý do (Từ người dùng)</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map(r => (
              <TableRow key={r.id} className="hover:bg-muted/20">
                <TableCell>
                  <p className="font-bold text-sm">{r.targetName}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">{r.targetType}</Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{r.reason}</p>
                  <p className="text-xs text-muted-foreground">Bởi: {r.reporter} · {r.date}</p>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "RESOLVED" ? "bg-emerald-100 text-emerald-700" : r.status === "REJECTED" ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {r.status === "RESOLVED" ? "Đã xử lý" : r.status === "REJECTED" ? "Đã bỏ qua" : "Chờ kiểm tra"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {r.status === "PENDING" && (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-emerald-600 hover:bg-emerald-50" onClick={() => handleAction(r.id, "RESOLVED")}>
                          Xử lý vi phạm
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-muted-foreground hover:bg-muted" onClick={() => handleAction(r.id, "REJECTED")}>
                          Bỏ qua
                        </Button>
                      </>
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
