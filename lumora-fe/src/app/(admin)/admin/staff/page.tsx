"use client";

import { useState } from "react";
import { Shield, Plus, Key, UserCog, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const MOCK_STAFF = [
  { id: "s1", name: "Nguyễn V. Admin", email: "admin@lumora.vn", role: "SUPER_ADMIN", status: "ACTIVE", lastLogin: "2026-07-22 09:15:00" },
  { id: "s2", name: "Trần Staff (CSKH)", email: "cskh1@lumora.vn", role: "SUPPORT", status: "ACTIVE", lastLogin: "2026-07-22 08:30:00" },
  { id: "s3", name: "Lê Kế Toán", email: "ketoan@lumora.vn", role: "FINANCE", status: "INACTIVE", lastLogin: "2026-07-20 17:00:00" },
];

export default function StaffPage() {
  const handleDelete = () => toast.success("Đã xóa nhân viên");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản trị & Phân quyền 🛡️</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý đội ngũ nhân viên và phân quyền truy cập hệ thống.</p>
        </div>
        <Button className="rounded-xl gap-2 h-9">
          <Plus className="h-4 w-4" /> Thêm nhân viên
        </Button>
      </div>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Nhân viên</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Vai trò (Role)</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Lần đăng nhập cuối</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_STAFF.map(s => (
              <TableRow key={s.id} className="hover:bg-muted/20">
                <TableCell>
                  <p className="font-bold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={s.role === "SUPER_ADMIN" ? "bg-red-50 text-red-700 border-red-200" : ""}>
                    {s.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                    {s.status === "ACTIVE" ? "Đang làm việc" : "Đã khóa"}
                  </span>
                </TableCell>
                <TableCell><span className="text-sm text-muted-foreground">{s.lastLogin}</span></TableCell>
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
