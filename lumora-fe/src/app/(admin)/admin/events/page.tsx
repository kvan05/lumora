"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Search, CheckCircle, X, Eye, Edit, AlertTriangle,
  RefreshCw, Filter, Clock, AlertCircle, MapPin, User, FileEdit, Check, ArrowRight, LayoutGrid
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import api from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  DRAFT: { label: "Nháp", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Clock },
  PENDING: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  PENDING_APPROVAL: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  PUBLISHED: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  PAUSED: { label: "Tạm dừng", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: X },
  COMPLETED: { label: "Đã kết thúc", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  REJECTED: { label: "Từ chối", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: X },
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("all");

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editRequestModalOpen, setEditRequestModalOpen] = useState(false);
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

  const editRequestsList = events.filter(e => e.editRequestStatus === "PENDING_REVIEW");

  const filtered = events.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.organizer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (eventId: string, status: string) => {
    try {
      const res = await api.patch(`/admin/events/${eventId}/status`, { status, approvalNote });
      if (res?.data?.success) {
        toast.success(res.data.message || `Cập nhật trạng thái thành ${status}`);
        loadEvents();
      }
      if (detailOpen) setDetailOpen(false);
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái sự kiện.");
    }
  };

  const handleEditRequestDecision = async (eventId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const res = await api.patch(`/admin/events/${eventId}/edit-request`, { action, approvalNote });
      if (res?.data?.success) {
        toast.success(res.data.message || (action === "ACCEPT" ? "Đã duyệt chỉnh sửa!" : "Đã từ chối!"));
        loadEvents();
        setEditRequestModalOpen(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Không thể xử lý yêu cầu chỉnh sửa.");
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

  const pendingCount = events.filter(e => e.status === "PENDING" || e.status === "PENDING_APPROVAL").length;
  const publishedCount = events.filter(e => e.status === "PUBLISHED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý sự kiện 🎪</h1>
          <p className="text-sm text-muted-foreground mt-1">Duyệt sự kiện mới, xử lý yêu cầu chỉnh sửa từ Seller và quản lý toàn bộ hệ thống.</p>
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
          { label: "Chờ duyệt ban đầu", value: pendingCount, color: "text-amber-500" },
          { label: "Yêu cầu chỉnh sửa", value: editRequestsList.length, color: "text-purple-600" },
          { label: "Đã duyệt / Mở bán", value: publishedCount, color: "text-emerald-500" },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="rounded-xl p-1 bg-muted/50">
          <TabsTrigger value="all" className="rounded-lg font-bold text-xs sm:text-sm px-4">
            Tất cả sự kiện ({events.length})
          </TabsTrigger>
          <TabsTrigger value="edit_requests" className="rounded-lg font-bold text-xs sm:text-sm px-4 relative">
            Yêu cầu chỉnh sửa ({editRequestsList.length})
            {editRequestsList.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: All Events */}
        <TabsContent value="all" className="space-y-4">
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
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Chờ duyệt</SelectItem>
                  <SelectItem value="PUBLISHED">Đã duyệt</SelectItem>
                  <SelectItem value="PAUSED">Tạm dừng</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  <SelectItem value="REJECTED">Từ chối</SelectItem>
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
                  const hasEditReq = event.editRequestStatus === "PENDING_REVIEW";
                  return (
                    <TableRow key={event.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{event.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{event.category}</span>
                              {hasEditReq && (
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px]">
                                  Có yêu cầu sửa
                                </Badge>
                              )}
                            </div>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Xem chi tiết" onClick={() => { setSelectedEvent(event); setDetailOpen(true); setApprovalNote(""); }}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" title="Sửa trực tiếp" onClick={() => openDirectEdit(event)}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          {(event.status === "PENDING" || event.status === "PENDING_APPROVAL") && (
                            <Button size="sm" className="h-8 text-xs px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold" onClick={() => handleStatusChange(event.id, "PUBLISHED")}>
                              Duyệt
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
        </TabsContent>

        {/* Tab 2: Edit Requests */}
        <TabsContent value="edit_requests" className="space-y-4">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileEdit className="h-5 w-5 text-purple-600" />
                Danh Sách Yêu Cầu Chỉnh Sửa Từ Seller
              </CardTitle>
              <CardDescription>
                Những sự kiện đã mở bán nhưng Seller gửi yêu cầu thay đổi thông tin. Admin cần duyệt trước khi áp dụng.
              </CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold text-xs uppercase w-[35%]">Sự kiện</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Nhà tổ chức</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Trạng thái yêu cầu</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Xử lý</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editRequestsList.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Không có yêu cầu chỉnh sửa nào đang chờ duyệt.</TableCell></TableRow>
                ) : editRequestsList.map((event) => (
                  <TableRow key={event.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-bold text-sm">{event.title}</div>
                      <span className="text-xs text-muted-foreground">{event.category} - {event.city}</span>
                    </TableCell>
                    <TableCell className="text-sm">{event.organizer}</TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-bold">
                        ⏳ Chờ Admin xét duyệt
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                        onClick={() => { setSelectedEvent(event); setEditRequestModalOpen(true); setApprovalNote(""); }}
                      >
                        <Eye className="h-4 w-4" /> Xem & Duyệt Đề Xuất
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Edit Request Modal */}
      <Dialog open={editRequestModalOpen} onOpenChange={setEditRequestModalOpen}>
        <DialogContent className="max-w-3xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <FileEdit className="h-5 w-5" /> Xét Duyệt Yêu Cầu Chỉnh Sửa Sự Kiện
            </DialogTitle>
            <DialogDescription>
              So sánh thông tin hiện tại trên hệ thống và nội dung mới do Seller đề xuất.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && selectedEvent.pendingChanges && (
            <div className="space-y-6">
              {(() => {
                const proposed = JSON.parse(selectedEvent.pendingChanges);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Current Info */}
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 pb-2 border-b">
                        🔴 Thông tin Đang Mở Bán
                      </h4>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Tên sự kiện</p>
                        <p className="font-bold text-sm">{selectedEvent.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Danh mục / Thành phố</p>
                        <p className="text-sm">{selectedEvent.category} - {selectedEvent.city}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Địa điểm</p>
                        <p className="text-sm">{selectedEvent.venue} ({selectedEvent.address})</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Thời gian</p>
                        <p className="text-xs font-mono">{new Date(selectedEvent.startDate).toLocaleString("vi-VN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Mô tả</p>
                        <p className="text-xs line-clamp-3 text-muted-foreground">{selectedEvent.description}</p>
                      </div>
                    </div>

                    {/* Proposed Changes */}
                    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-900 space-y-3">
                      <h4 className="font-bold text-sm text-purple-700 dark:text-purple-300 pb-2 border-b border-purple-200">
                        ✨ Đề Xuất Thay Đổi Mới
                      </h4>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Tên sự kiện</p>
                        <p className="font-bold text-sm text-purple-900 dark:text-purple-200">{proposed.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Danh mục / Thành phố</p>
                        <p className="text-sm">{proposed.category} - {proposed.city}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Địa điểm</p>
                        <p className="text-sm">{proposed.venue} ({proposed.address})</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Thời gian</p>
                        <p className="text-xs font-mono">{proposed.startDate ? new Date(proposed.startDate).toLocaleString("vi-VN") : "Giữ nguyên"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Mô tả mới</p>
                        <p className="text-xs line-clamp-3">{proposed.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider">Ghi chú phản hồi cho Seller (Tùy chọn)</label>
                <Textarea
                  placeholder="Ghi chú về việc chấp nhận hoặc lý do từ chối..."
                  className="rounded-xl resize-none text-sm"
                  rows={2}
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" className="rounded-xl" onClick={() => setEditRequestModalOpen(false)}>Hủy</Button>
                <Button
                  variant="destructive"
                  className="rounded-xl font-bold"
                  onClick={() => handleEditRequestDecision(selectedEvent.id, "REJECT")}
                >
                  <X className="h-4 w-4 mr-1.5" /> Từ Chối Yêu Cầu
                </Button>
                <Button
                  className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleEditRequestDecision(selectedEvent.id, "ACCEPT")}
                >
                  <Check className="h-4 w-4 mr-1.5" /> Phê Duyệt & Đổi Thông Tin Ngay
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Direct Edit Modal for Admin */}
      <Dialog open={directEditModalOpen} onOpenChange={setDirectEditModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>Chỉnh Sửa Sự Kiện (Quyền Admin)</span>
              {selectedEvent && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-[#93C453] text-[#4A7C59] dark:text-[#93C453] hover:bg-[#93C453]/10 text-xs font-bold mr-6"
                  onClick={() => {
                    setDirectEditModalOpen(false);
                    router.push(`/seller/events/${selectedEvent.id}/seats`);
                  }}
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Quản Lý Sơ Đồ Ghế & Vé
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              Cập nhật đầy đủ thông tin sự kiện, ảnh bìa banner, thời gian và thiết lập sơ đồ ghế.
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
              {editForm.bannerUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-border h-32 relative bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editForm.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              )}
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

            <div className="flex justify-between items-center pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-xs font-bold border-[#93C453] text-[#4A7C59] dark:text-[#93C453] hover:bg-[#93C453]/10"
                onClick={() => {
                  setDirectEditModalOpen(false);
                  router.push(`/seller/events/${selectedEvent?.id}/seats`);
                }}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Cấu hình sơ đồ ghế & Vé
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDirectEditModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="rounded-xl font-bold bg-[#93C453] hover:bg-[#82B342] text-slate-900">Lưu Cập Nhật</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

