"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { History, Search, RefreshCw, FileText, Filter, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Fetch 100% Real Audit Logs from Backend API
  const { data: logsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-audit-logs", search, roleFilter, actionFilter],
    queryFn: async () => {
      const querySearch = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await api.get(`/admin/logs?role=${roleFilter}&action=${actionFilter}${querySearch}`);
      return res.data.success ? res.data.data : [];
    },
  });

  const logs = Array.isArray(logsData) ? logsData : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <History className="h-7 w-7 text-primary" /> Nhật Ký Hệ Thống
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nhật ký kiểm toán toàn hệ thống — Ghi vết thời gian thực tất cả hành động nhạy cảm của Quản trị viên, Ban tổ chức và Nhân viên.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold gap-2 border-border/60 self-start sm:self-auto"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Hành động, Tên người thực hiện, Email, Nội dung..."
              className="pl-9 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
              <SelectValue placeholder="Vai trò thực hiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả vai trò</SelectItem>
              <SelectItem value="ADMIN">Quản trị viên (ADMIN)</SelectItem>
              <SelectItem value="SELLER">Ban tổ chức (SELLER)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-52 h-10 rounded-xl">
              <SelectValue placeholder="Hành động" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả hành động</SelectItem>
              <SelectItem value="OVERRIDE_CHECKIN">Ghi đè Check-in / Soát vé</SelectItem>
              <SelectItem value="APPROVED_REFUND">Duyệt hoàn tiền</SelectItem>
              <SelectItem value="REJECTED_REFUND">Từ chối hoàn tiền</SelectItem>
              <SelectItem value="UPDATE_USER_ROLE">Đổi vai trò người dùng</SelectItem>
              <SelectItem value="CREATE_RECONCILIATION">Tạo kỳ đối soát</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Chưa có nhật ký kiểm toán nào</p>
              <p className="text-xs mt-1">Dữ liệu kiểm toán trong cơ sở dữ liệu đang trống hoặc không khớp từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Thời gian</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Người thực hiện</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Hành động</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Chi tiết nội dung</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Địa chỉ IP</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </TableCell>

                      <TableCell>
                        <p className="font-bold text-xs text-foreground">{log.admin?.name || log.admin?.email || "Hệ thống"}</p>
                        <Badge variant="outline" className="text-[10px] h-4 font-mono px-1">
                          {log.admin?.role === "ADMIN" ? "Quản trị viên" : log.admin?.role === "SELLER" ? "Ban tổ chức" : "Hệ thống"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-mono font-extrabold text-xs text-primary border-primary/30">
                          {log.action}
                        </Badge>
                      </TableCell>

                      <TableCell className="max-w-[280px]">
                        <p className="text-xs font-mono text-muted-foreground truncate" title={log.details}>
                          {log.details}
                        </p>
                      </TableCell>

                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.ipAddress || "Nội bộ"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-xl"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4 text-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Inspector Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Chi Tiết Bản Ghi Nhật Ký
            </DialogTitle>
            <DialogDescription className="text-xs">Dữ liệu nhật ký được ghi vết an toàn trong cơ sở dữ liệu.</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border space-y-1 font-mono">
                <p>Mã nhật ký: {selectedLog.id}</p>
                <p>Hành động: <span className="font-bold text-primary">{selectedLog.action}</span></p>
                <p>Thời gian: {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}</p>
                <p>Địa chỉ IP: {selectedLog.ipAddress || "Không có"}</p>
              </div>

              <div>
                <p className="font-bold text-foreground mb-1">Nội dung chi tiết (JSON):</p>
                <pre className="p-3 rounded-xl bg-slate-950 text-slate-50 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-60">
                  {JSON.stringify(JSON.parse(selectedLog.details || "{}"), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
