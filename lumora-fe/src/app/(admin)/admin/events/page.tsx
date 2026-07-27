"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Search, CheckCircle, X, Eye, Edit, EyeOff, Flag,
  RefreshCw, Filter, ChevronDown, Clock, AlertCircle, Download,
  MapPin, User, Tag, Image as ImageIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  DRAFT: { label: "Nháp", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Clock },
  PENDING: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  PUBLISHED: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  PAUSED: { label: "Tạm dừng", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: X },
  COMPLETED: { label: "Đã kết thúc", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  REJECTED: { label: "Từ chối", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: X },
};

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/events");
      if (res?.data?.success && Array.isArray(res.data.data)) {
        const formattedEvents = res.data.data.map((e: any) => ({
          ...e,
          organizer: e.seller?.name || e.seller?.email || "Unknown",
        }));
        setEvents(formattedEvents);
      }
    } catch (error) { 
      toast.error("Không thể tải dữ liệu sự kiện.");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const filtered = events.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.organizer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (eventId: string, status: string) => {
    try {
      const res = await api.patch(`/admin/events/${eventId}/status`, { status });
      if (res?.data?.success) {
        toast.success(res.data.message || `Cập nhật trạng thái thành ${status}`);
        loadEvents();
      }
      if (detailOpen) setDetailOpen(false);
    } catch (error) { 
      toast.error("Không thể cập nhật trạng thái sự kiện."); 
    }
  };

  const pendingCount = events.filter(e => e.status === "PENDING").length;
  const publishedCount = events.filter(e => e.status === "PUBLISHED").length;
  const cancelledCount = events.filter(e => e.status === "CANCELLED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý sự kiện 🎪</h1>
          <p className="text-sm text-muted-foreground mt-1">Duyệt, theo dõi và quản lý tất cả sự kiện trên hệ thống.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2 h-9 text-sm" onClick={loadEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng sự kiện", value: events.length, color: "text-foreground" },
          { label: "Chờ duyệt", value: pendingCount, color: "text-yellow-500" },
          { label: "Đã duyệt", value: publishedCount, color: "text-emerald-500" },
          { label: "Đã hủy", value: cancelledCount, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo Tên sự kiện, Nhà tổ chức..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9 rounded-xl">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="PUBLISHED">Đã duyệt</SelectItem>
              <SelectItem value="PAUSED">Tạm dừng</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider w-[35%]">Sự kiện</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Nhà tổ chức</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Địa điểm</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden lg:table-cell">Ngày tổ chức</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Không tìm thấy sự kiện nào.</TableCell></TableRow>
            ) : filtered.map((event) => {
              const statusConf = STATUS_CONFIG[event.status] || STATUS_CONFIG.DRAFT;
              return (
                <TableRow key={event.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{event.title}</p>
                        <span className="text-xs text-muted-foreground">{event.category}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-sm text-muted-foreground">{event.organizer}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {event.city}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="text-sm">{new Date(event.startDate).toLocaleDateString("vi-VN")}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.className}`}>
                      {statusConf.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setSelectedEvent(event); setDetailOpen(true); setRejectReason(""); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {event.status === "PENDING" && (
                        <>
                          <Button size="sm" className="h-8 text-xs px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleStatusChange(event.id, "PUBLISHED")}>
                            Duyệt
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs px-3 rounded-lg text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => { setSelectedEvent(event); setDetailOpen(true); }}>
                            Từ chối
                          </Button>
                        </>
                      )}
                      {event.status === "PUBLISHED" && (
                        <Button size="sm" variant="outline" className="h-8 text-xs px-3 rounded-lg text-orange-500 hover:bg-orange-50 border-orange-200" onClick={() => handleStatusChange(event.id, "PAUSED")}>
                          Tạm dừng
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

      {/* Event Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Chi tiết sự kiện</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {/* Banner placeholder */}
              <div className="w-full h-32 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-primary/40" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Tên sự kiện", value: selectedEvent.title },
                  { label: "Nhà tổ chức", value: selectedEvent.organizer },
                  { label: "Danh mục", value: selectedEvent.category },
                  { label: "Thành phố", value: selectedEvent.city },
                  { label: "Địa điểm", value: selectedEvent.venue },
                  { label: "Ngày tổ chức", value: new Date(selectedEvent.startDate).toLocaleDateString("vi-VN") },
                ].map(item => (
                  <div key={item.label} className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                    <p className="font-semibold mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-muted/30 rounded-xl p-3 text-sm">
                <p className="text-xs text-muted-foreground font-medium mb-1">Mô tả</p>
                <p>{selectedEvent.description}</p>
              </div>

              <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                <span className="text-sm font-medium">Trạng thái hiện tại</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[selectedEvent.status]?.className}`}>
                  {STATUS_CONFIG[selectedEvent.status]?.label}
                </span>
              </div>

              {selectedEvent.status === "PENDING" && (
                <div className="space-y-2">
                  <label className="text-sm font-bold">Lý do từ chối (nếu từ chối)</label>
                  <Textarea
                    placeholder="Nhập lý do từ chối sự kiện này..."
                    className="rounded-xl resize-none"
                    rows={3}
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-between gap-3 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setDetailOpen(false)}>Đóng</Button>
                {selectedEvent.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleStatusChange(selectedEvent.id, "REJECTED")}
                    >
                      <X className="h-4 w-4 mr-1.5" /> Từ chối
                    </Button>
                    <Button
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => handleStatusChange(selectedEvent.id, "PUBLISHED")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" /> Duyệt
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
