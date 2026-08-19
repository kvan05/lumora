"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Search, CheckCircle, X, Eye, Edit, AlertCircle,
  RefreshCw, MapPin, Activity, EyeOff, Check, RotateCcw,
  Building2, Layers, Filter, CheckCircle2, AlertTriangle, Layers2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import api from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  DRAFT: { label: "Bản nháp", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: AlertCircle },
  PUBLISHED: { label: "Đã xuất bản / Mở bán", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", icon: CheckCircle },
  PAUSED: { label: "Tạm dừng mở bán", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", icon: AlertCircle },
  HIDDEN: { label: "Bị ẩn (Vi phạm)", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", icon: EyeOff },
  CANCELLED: { label: "Đã hủy", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", icon: X },
  COMPLETED: { label: "Đã kết thúc", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", icon: CheckCircle },
};

const CATEGORIES = [
  "Concert & Âm nhạc",
  "Sân khấu & Kịch",
  "Thể thao",
  "Workshop / Khóa học",
  "Tham quan & Du lịch",
  "Hội thảo / Sự kiện doanh nghiệp",
  "Công viên & Giải trí",
  "Ẩm thực",
  "Triển lãm",
  "Khác",
];

export default function EventsPage() {
  const router = useRouter();

  // Data states
  const [events, setEvents] = useState<any[]>([]);
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [organizerFilter, setOrganizerFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("all");

  // Modals
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

  // Load Organizers for Dropdown Filter
  const loadOrganizers = async () => {
    try {
      const res = await api.get("/admin/organizers");
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setOrganizers(res.data.data);
      }
    } catch {}
  };

  // Fetch Events from API with parameters
  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (organizerFilter !== "ALL") params.set("sellerId", organizerFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (periodFilter !== "all") params.set("period", periodFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await api.get(`/admin/events?${params.toString()}`);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        const formattedEvents = res.data.data.map((e: any) => {
          const orgName = e.seller?.OrganizerProfile?.orgName || e.seller?.name || e.seller?.email || "Chưa đặt tên NTC";
          return {
            ...e,
            organizer: orgName,
          };
        });
        setEvents(formattedEvents);
      }
    } catch (error) {
      toast.error("Không thể tải dữ liệu sự kiện.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizers();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [statusFilter, organizerFilter, categoryFilter, periodFilter, search]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setOrganizerFilter("ALL");
    setCategoryFilter("ALL");
    setPeriodFilter("all");
    toast.success("Đã đặt lại tất cả bộ lọc");
  };

  // Status Change Handler (Publish, Hide, Pause)
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

  // Submit Direct Edit
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

  // Stats Count calculations
  const totalCount = events.length;
  const publishedCount = events.filter(e => e.status === "PUBLISHED").length;
  const pausedCount = events.filter(e => e.status === "PAUSED").length;
  const hiddenCount = events.filter(e => e.status === "HIDDEN").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Calendar className="h-8 w-8 text-primary" /> Quản Lý Sự Kiện (Events)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý trạng thái xuất bản mở bán, duyệt hiển thị sự kiện và hỗ trợ Nhà tổ chức.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-bold gap-2 h-10 text-xs border-border/60"
            onClick={loadEvents}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* 4 Interactive Clickable Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total Events */}
        <Card
          onClick={() => setStatusFilter("ALL")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            statusFilter === "ALL"
              ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md scale-[1.02]"
              : "border-border/60 bg-card hover:border-primary/50 hover:bg-muted/20"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-extrabold uppercase tracking-wider">Tổng Sự Kiện</p>
              <p className="text-2xl font-black text-foreground mt-1">{totalCount}</p>
            </div>
            <div className={`p-3 rounded-2xl ${statusFilter === "ALL" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Published Events */}
        <Card
          onClick={() => setStatusFilter("PUBLISHED")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            statusFilter === "PUBLISHED"
              ? "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]"
              : "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider">Đã Xuất Bản / Mở Bán</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{publishedCount}</p>
            </div>
            <div className={`p-3 rounded-2xl ${statusFilter === "PUBLISHED" ? "bg-emerald-600 text-white" : "bg-emerald-500/20 text-emerald-600"}`}>
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Paused Events */}
        <Card
          onClick={() => setStatusFilter("PAUSED")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            statusFilter === "PAUSED"
              ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-md scale-[1.02]"
              : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-extrabold uppercase tracking-wider">Tạm Dừng Mở Bán</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pausedCount}</p>
            </div>
            <div className={`p-3 rounded-2xl ${statusFilter === "PAUSED" ? "bg-amber-600 text-white" : "bg-amber-500/20 text-amber-600"}`}>
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Hidden Events (Violation) */}
        <Card
          onClick={() => setStatusFilter("HIDDEN")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            statusFilter === "HIDDEN"
              ? "border-red-500 bg-red-500/15 ring-2 ring-red-500/30 shadow-md scale-[1.02]"
              : "border-red-500/30 bg-red-500/5 hover:border-red-500 hover:bg-red-500/10"
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-700 dark:text-red-400 font-extrabold uppercase tracking-wider">Bị Ẩn (Vi Phạm)</p>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{hiddenCount}</p>
            </div>
            <div className={`p-3 rounded-2xl ${statusFilter === "HIDDEN" ? "bg-red-600 text-white" : "bg-red-500/20 text-red-600"}`}>
              <EyeOff className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Parameter Filter Toolbar */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm Tên sự kiện, Nhà tổ chức..."
                className="pl-9 h-10 rounded-xl text-xs font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* 2. Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="Trạng thái mở bán" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="text-xs font-bold">Tất cả trạng thái</SelectItem>
                <SelectItem value="PUBLISHED" className="text-xs">Đã xuất bản / Mở bán</SelectItem>
                <SelectItem value="PAUSED" className="text-xs">Tạm dừng mở bán</SelectItem>
                <SelectItem value="HIDDEN" className="text-xs">Bị ẩn (Vi phạm Admin)</SelectItem>
                <SelectItem value="DRAFT" className="text-xs">Bản nháp</SelectItem>
                <SelectItem value="COMPLETED" className="text-xs">Đã kết thúc</SelectItem>
                <SelectItem value="CANCELLED" className="text-xs">Đã hủy</SelectItem>
              </SelectContent>
            </Select>

            {/* 3. Organizer Filter */}
            <Select value={organizerFilter} onValueChange={setOrganizerFilter}>
              <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="Nhà tổ chức" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-64">
                <SelectItem value="ALL" className="text-xs font-bold">Tất cả Nhà tổ chức</SelectItem>
                {organizers.map((org: any) => (
                  <SelectItem key={org.userId || org.id} value={org.userId || org.id} className="text-xs">
                    {org.orgName || org.name} ({org.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 4. Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="Danh mục sự kiện" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="text-xs font-bold">Tất cả danh mục</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 5. Period Date Filter */}
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                <SelectValue placeholder="Khoảng thời gian" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs font-bold">Tất cả thời gian</SelectItem>
                <SelectItem value="today" className="text-xs">Hôm nay</SelectItem>
                <SelectItem value="7d" className="text-xs">7 ngày gần nhất</SelectItem>
                <SelectItem value="30d" className="text-xs">30 ngày gần nhất</SelectItem>
                <SelectItem value="90d" className="text-xs">90 ngày gần nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Badge & Reset Button */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-muted-foreground font-medium">
              Hiển thị <strong className="text-foreground">{events.length}</strong> sự kiện sau khi lọc
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 rounded-lg text-muted-foreground hover:text-foreground gap-1.5 font-semibold text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Đặt lại bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="rounded-3xl border-border/60 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không tìm thấy sự kiện nào</p>
              <p className="text-xs mt-1">Vui lòng thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-bold text-xs uppercase tracking-wider w-[35%]">Tên Sự Kiện & Danh Mục</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Nhà Tổ Chức</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Địa Điểm & Thành Phố</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Trạng Thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành Động Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const statusConf = STATUS_CONFIG[event.status] || STATUS_CONFIG.DRAFT;
                    return (
                      <TableRow key={event.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {event.bannerUrl ? (
                              <img src={event.bannerUrl} alt={event.title} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border/60" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold">
                                <Calendar className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-extrabold text-sm text-foreground line-clamp-1">{event.title}</p>
                              <Badge variant="outline" className="text-[10px] font-semibold mt-0.5">{event.category || "Sự kiện"}</Badge>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell">
                          <p className="text-xs font-bold text-foreground line-clamp-1">{event.organizer}</p>
                          <p className="text-[11px] text-muted-foreground">{event.seller?.email}</p>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="line-clamp-1">{event.venue}, {event.city}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge className={`${statusConf.className} border-none font-bold text-xs py-0.5 px-2.5`}>
                            {statusConf.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-xl text-xs font-bold gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10"
                              title="Xem Health Score"
                              onClick={() => { setSelectedEvent(event); setDetailOpen(true); }}
                            >
                              <Activity className="h-3.5 w-3.5" /> Score
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
                                className="h-8 text-xs px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                                onClick={() => handleStatusChange(event.id, "PUBLISHED")}
                              >
                                <Check className="h-3.5 w-3.5" /> Mở lại
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 text-xs px-3 rounded-xl font-bold gap-1"
                                onClick={() => handleStatusChange(event.id, "HIDDEN")}
                              >
                                <EyeOff className="h-3.5 w-3.5" /> Ẩn sự kiện
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 bg-card border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Chi tiết sự kiện: {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mã ID: {selectedEvent?.id} · Nhà tổ chức: {selectedEvent?.organizer}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/20 border">
                  <p className="text-muted-foreground font-semibold">Danh mục</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedEvent.category}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/20 border">
                  <p className="text-muted-foreground font-semibold">Thành phố / Địa điểm</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedEvent.venue}, {selectedEvent.city}</p>
                </div>
              </div>

              {selectedEvent.bannerUrl && (
                <div className="h-40 rounded-xl overflow-hidden border">
                  <img src={selectedEvent.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-3 rounded-xl bg-muted/20 border space-y-1">
                <p className="font-semibold text-muted-foreground">Mô tả sự kiện</p>
                <p className="text-foreground leading-relaxed">{selectedEvent.description || "Chưa có mô tả"}</p>
              </div>

              {/* Status Action controls */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                <p className="font-bold text-sm text-primary">Thay đổi trạng thái hiển thị (Quyền Admin)</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusChange(selectedEvent.id, "PUBLISHED")}>
                    Mở bán công khai (PUBLISHED)
                  </Button>
                  <Button size="sm" className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleStatusChange(selectedEvent.id, "PAUSED")}>
                    Tạm dừng mở bán (PAUSED)
                  </Button>
                  <Button size="sm" variant="destructive" className="rounded-xl text-xs font-bold" onClick={() => handleStatusChange(selectedEvent.id, "HIDDEN")}>
                    Ẩn do vi phạm (HIDDEN)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Direct Edit Modal for Admin */}
      <Dialog open={directEditModalOpen} onOpenChange={setDirectEditModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto p-6 bg-card border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center justify-between">
              <span>Chỉnh Sửa Sự Kiện (Quyền Admin)</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật trực tiếp thông tin nội dung sự kiện.
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
              <Textarea className="rounded-xl mt-1 resize-none font-sans text-xs" rows={4} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="ghost" className="rounded-xl text-xs font-bold" onClick={() => setDirectEditModalOpen(false)}>Hủy</Button>
              <Button type="submit" className="rounded-xl text-xs font-bold bg-primary text-primary-foreground">Lưu Cập Nhật</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
