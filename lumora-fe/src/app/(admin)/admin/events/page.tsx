"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Search, CheckCircle, X, Eye, Edit, AlertCircle,
  RefreshCw, MapPin, Activity, EyeOff, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  DRAFT: { label: "Bản nháp", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: AlertCircle },
  PUBLISHED: { label: "Đã xuất bản", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  PAUSED: { label: "Tạm dừng", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertCircle },
  HIDDEN: { label: "Bị ẩn (Admin)", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: EyeOff },
  CANCELLED: { label: "Đã hủy", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", icon: X },
  COMPLETED: { label: "Đã kết thúc", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [directEditModalOpen, setDirectEditModalOpen] = useState(false);

  const [approvalNote, setApprovalNote] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    venue: "",
    address: "",
    city: "",
    bannerUrl: "",
    startDate: "",
    endDate: "",
    description: "",
  });

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
      const res = await api.patch(`/admin/events/${eventId}/status`, { status, approvalNote });
      if (res?.data?.success) {
        toast.success(res.data.message || `Đã cập nhật trạng thái thành ${status}`);
        loadEvents();
      }
      if (detailOpen) setDetailOpen(false);
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái sự kiện.");
    }
  };

  const handleDirectEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      const payload: any = { ...editForm };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;

      const res = await api.put(`/events/${selectedEvent.id}`, payload);
      if (res?.data?.success) {
        toast.success("Cập nhật thông tin sự kiện thành công!");
        loadEvents();
        setDirectEditModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Không thể cập nhật sự kiện.");
    }
  };

  const openDirectEdit = (event: any) => {
    setSelectedEvent(event);
    setEditForm({
      title: event.title || "",
      category: event.category || "",
      venue: event.venue || "",
      address: event.address || "",
      city: event.city || "",
      bannerUrl: event.bannerUrl || "",
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
      description: event.description || "",
    });
    setDirectEditModalOpen(true);
  };

  const publishedCount = events.filter(e => e.status === "PUBLISHED").length;
  const pausedCount = events.filter(e => e.status === "PAUSED").length;
  const hiddenCount = events.filter(e => e.status === "HIDDEN").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý sự kiện 🎪</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý trạng thái hiển thị sự kiện và hỗ trợ người tổ chức.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2 h-9 text-sm" onClick={loadEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng sự kiện", value: events.length, color: "text-foreground" },
          { label: "Đã xuất bản / Mở bán", value: publishedCount, color: "text-emerald-500" },
          { label: "Tạm dừng mở bán", value: pausedCount, color: "text-amber-500" },
          { label: "Bị ẩn (Vi phạm)", value: hiddenCount, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Table */}
      <div className="space-y-4">
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo Tên sự kiện, Nhà tổ chức..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 h-9 rounded-xl">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
                <SelectItem value="PAUSED">Tạm dừng</SelectItem>
                <SelectItem value="HIDDEN">Bị ẩn (Admin)</SelectItem>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold text-xs uppercase w-[35%]">Sự kiện</TableHead>
                <TableHead className="font-bold text-xs uppercase hidden sm:table-cell">Nhà tổ chức</TableHead>
                <TableHead className="font-bold text-xs uppercase hidden md:table-cell">Địa điểm</TableHead>
                <TableHead className="font-bold text-xs uppercase">Trạng thái</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Không tìm thấy sự kiện nào.</TableCell></TableRow>
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
                    <TableCell>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusConf.className}`}>
                        {statusConf.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl text-xs font-bold gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10"
                          title="Xem Health Score"
                          onClick={() => {
                            setSelectedEvent(event);
                            setDetailOpen(true);
                          }}
                        >
                          <Activity className="h-3.5 w-3.5" /> Health Score
                        </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Xem chi tiết" onClick={() => { setSelectedEvent(event); setDetailOpen(true); setApprovalNote(""); }}>
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" title="Sửa trực tiếp" onClick={() => openDirectEdit(event)}>
                          <Edit className="h-4 w-4" />
                        </Button>

                        {event.status === "HIDDEN" ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            onClick={() => handleStatusChange(event.id, "PUBLISHED")}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Mở lại
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 text-xs px-3 rounded-lg font-bold"
                            onClick={() => handleStatusChange(event.id, "HIDDEN")}
                          >
                            <EyeOff className="h-3.5 w-3.5 mr-1" /> Ẩn sự kiện
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
      </div>

      {/* Direct Edit Modal for Admin */}
      <Dialog open={directEditModalOpen} onOpenChange={setDirectEditModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>Chỉnh Sửa Sự Kiện (Quyền Admin)</span>
            </DialogTitle>
            <DialogDescription>
              Cập nhật trực tiếp thông tin sự kiện.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDirectEditSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold">Tên sự kiện</label>
              <Input className="rounded-xl mt-1" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold">Danh mục</label>
                <Input className="rounded-xl mt-1" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold">Thành phố</label>
                <Input className="rounded-xl mt-1" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold">Tên địa điểm</label>
                <Input className="rounded-xl mt-1" value={editForm.venue} onChange={e => setEditForm({ ...editForm, venue: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold">Địa chỉ chi tiết</label>
                <Input className="rounded-xl mt-1" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold">Link Ảnh Bìa (Banner URL)</label>
              <Input className="rounded-xl mt-1" placeholder="https://..." value={editForm.bannerUrl} onChange={e => setEditForm({ ...editForm, bannerUrl: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold">Thời gian bắt đầu</label>
                <Input type="datetime-local" className="rounded-xl mt-1" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold">Thời gian kết thúc</label>
                <Input type="datetime-local" className="rounded-xl mt-1" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold">Mô tả sự kiện</label>
              <Textarea className="rounded-xl mt-1 resize-none font-sans text-sm" rows={4} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDirectEditModalOpen(false)}>Hủy</Button>
              <Button type="submit" className="rounded-xl font-bold bg-[#93C453] hover:bg-[#82B342] text-slate-900">Lưu Cập Nhật</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
