"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import {
  Users, Search, Plus, Shield, ShieldOff, Trash2, Edit3, RefreshCw,
  Eye, Mail, Phone, Calendar, Ticket, Lock, Unlock, ChevronRight,
  UserCheck, UserX, Loader2, Copy, Check, Key, AlertTriangle, X,
  ClipboardCopy, Activity, Filter, Building2, Award, MoreVertical,
  CheckCircle2, XCircle, UserPlus, Settings, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─────────────────────────── Types ─────────────────────────────────── */
interface StaffMember {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  isVerified: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  assignedEvents: {
    assignmentId: string;
    eventId: string;
    eventTitle: string;
    startDate: string;
    status: string;
  }[];
  eventCount: number;
}

interface SellerEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  venue: string;
  bannerUrl?: string;
}

/* ─────────────────────────── Helpers ───────────────────────────────── */
function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    return name.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    APPROVED: { label: "Đã duyệt", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    PUBLISHED: { label: "Công khai", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    DRAFT: { label: "Nháp", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
    ENDED: { label: "Đã kết thúc", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    CANCELLED: { label: "Đã hủy", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-zinc-500/15 text-zinc-400" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${s.cls}`}>
      {s.label}
    </span>
  );
}

/* ─────────────────────────── Page ──────────────────────────────────── */
export default function SellerStaffPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<"" | "true" | "false">("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [detailStaff, setDetailStaff] = useState<StaffMember | null>(null);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [assignStaff, setAssignStaff] = useState<StaffMember | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);
  const [toggleStaff, setToggleStaff] = useState<{ staff: StaffMember; nextActive: boolean } | null>(null);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Create form
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", note: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit form
  const [editForm, setEditForm] = useState({ name: "", phone: "", note: "", newPassword: "" });

  // Event assignment
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  /* ─── Data fetching ─── */
  const { data: staffData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["seller-staff", search, isActiveFilter],
    queryFn: async () => {
      const res = await api.get("/seller/staff", {
        params: {
          search: search || undefined,
          isActive: isActiveFilter || undefined,
        },
      });
      return res.data.data as StaffMember[];
    },
  });

  const { data: eventsData } = useQuery({
    queryKey: ["seller-events-for-staff"],
    queryFn: async () => {
      const res = await api.get("/seller/events");
      return (res.data.data?.events || res.data.data || []) as SellerEvent[];
    },
  });

  const { data: staffDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["staff-detail", detailStaff?.id],
    queryFn: async () => {
      const res = await api.get(`/seller/staff/${detailStaff!.id}`);
      return res.data.data;
    },
    enabled: !!detailStaff,
  });

  const staffList = staffData || [];
  const sellerEvents = eventsData || [];

  /* ─── Stats ─── */
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const lockedStaff = staffList.filter((s) => !s.isActive).length;
  const assignedStaff = staffList.filter((s) => s.eventCount > 0).length;

  /* ─── Mutations ─── */
  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/seller/staff", data),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success("Tạo nhân viên thành công!");
      qc.invalidateQueries({ queryKey: ["seller-staff"] });
      setCreateOpen(false);
      setForm({ name: "", email: "", phone: "", password: "", note: "" });
      setTempPasswordInfo({ name: d.name, email: d.email, password: d.tempPassword });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Tạo nhân viên thất bại");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      api.patch(`/seller/staff/${id}`, data),
    onSuccess: () => {
      toast.success("Đã cập nhật nhân viên");
      qc.invalidateQueries({ queryKey: ["seller-staff"] });
      setEditStaff(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/seller/staff/${id}/toggle-active`, { isActive }),
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "Đã mở khóa nhân viên" : "Đã khóa nhân viên");
      qc.invalidateQueries({ queryKey: ["seller-staff"] });
      setToggleStaff(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/seller/staff/${id}`),
    onSuccess: () => {
      toast.success("Đã xóa nhân viên");
      qc.invalidateQueries({ queryKey: ["seller-staff"] });
      setDeleteStaff(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Xóa thất bại");
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, eventIds }: { id: string; eventIds: string[] }) =>
      api.put(`/seller/staff/${id}/events`, { eventIds }),
    onSuccess: () => {
      toast.success("Đã cập nhật phân công sự kiện");
      qc.invalidateQueries({ queryKey: ["seller-staff"] });
      setAssignStaff(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Phân công thất bại");
    },
  });

  /* ─── Form validation ─── */
  const validateCreate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Họ tên là bắt buộc";
    if (!form.email.trim()) errors.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email không hợp lệ";
    if (form.password && form.password.length < 6) errors.password = "Mật khẩu tối thiểu 6 ký tự";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateCreate()) return;
    createMutation.mutate(form);
  };

  const handleEdit = () => {
    if (!editStaff) return;
    if (editForm.newPassword && editForm.newPassword.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    updateMutation.mutate({ id: editStaff.id, data: editForm });
  };

  const openEdit = (staff: StaffMember) => {
    setEditStaff(staff);
    setEditForm({ name: staff.name || "", phone: staff.phone || "", note: staff.note || "", newPassword: "" });
  };

  const openAssign = (staff: StaffMember) => {
    setAssignStaff(staff);
    setSelectedEventIds(staff.assignedEvents.map((e) => e.eventId));
  };

  const handleCopyPassword = () => {
    if (tempPasswordInfo) {
      navigator.clipboard.writeText(tempPasswordInfo.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleEventSelect = useCallback((eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  }, []);

  /* ─── Render ─── */
  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 font-bold uppercase text-[10px] tracking-wider">
              QUẢN LÝ NHÂN VIÊN
            </Badge>
            {isFetching && (
              <Badge variant="outline" className="text-[10px] animate-pulse flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin text-violet-500" /> Đang cập nhật...
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-violet-500" /> Quản lý nhân viên
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo và phân công nhân viên soát vé cho các sự kiện của bạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-2xl h-10 w-10 border border-border"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold px-5 rounded-xl shadow-sm gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng nhân viên", value: totalStaff, icon: Users, color: "violet" },
          { label: "Đang hoạt động", value: activeStaff, icon: UserCheck, color: "emerald" },
          { label: "Đã khóa", value: lockedStaff, icon: UserX, color: "red" },
          { label: "Đã gán sự kiện", value: assignedStaff, icon: Calendar, color: "amber" },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={`rounded-3xl border border-border/60 shadow-sm bg-gradient-to-br from-card via-card transition-all hover:border-opacity-50
              ${stat.color === "violet" ? "to-violet-500/5 hover:border-violet-500/30" :
                stat.color === "emerald" ? "to-emerald-500/5 hover:border-emerald-500/30" :
                stat.color === "red" ? "to-red-500/5 hover:border-red-500/30" :
                "to-amber-500/5 hover:border-amber-500/30"}`}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-black mt-1 text-foreground">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                ${stat.color === "violet" ? "bg-violet-500/10 text-violet-500" :
                  stat.color === "emerald" ? "bg-emerald-500/10 text-emerald-500" :
                  stat.color === "red" ? "bg-red-500/10 text-red-500" :
                  "bg-amber-500/10 text-amber-500"}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="pl-9 h-10 rounded-xl"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={isActiveFilter} onValueChange={(v) => setIsActiveFilter(v as "" | "true" | "false")}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả</SelectItem>
            <SelectItem value="true">Đang hoạt động</SelectItem>
            <SelectItem value="false">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Staff Table ── */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Chưa có nhân viên nào</p>
              <p className="text-muted-foreground text-sm mt-1">Thêm nhân viên đầu tiên để bắt đầu quản lý soát vé</p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl px-6 gap-2"
            >
              <UserPlus className="w-4 h-4" /> Thêm nhân viên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Nhân viên", "Email / SĐT", "Trạng thái", "Sự kiện được gán", "Ngày tạo", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffList.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Avatar + Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 ring-2 ring-border">
                            <AvatarImage src={staff.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-sm font-bold">
                              {getInitials(staff.name, staff.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card
                            ${staff.isActive ? "bg-emerald-500" : "bg-muted-foreground"}`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {staff.name || "—"}
                          </p>
                          {staff.isVerified && (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Đã xác minh
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email/Phone */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[180px]">{staff.email}</span>
                        </div>
                        {staff.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3 shrink-0" />
                            {staff.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {staff.isActive ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                          Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-medium">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          Đã khóa
                        </Badge>
                      )}
                    </td>

                    {/* Events */}
                    <td className="px-5 py-4">
                      {staff.eventCount === 0 ? (
                        <span className="text-muted-foreground text-sm">Chưa gán</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {staff.assignedEvents.slice(0, 3).map((ev) => (
                              <div
                                key={ev.eventId}
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 border-2 border-card flex items-center justify-center"
                                title={ev.eventTitle}
                              >
                                <Ticket className="w-2.5 h-2.5 text-white" />
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-foreground font-medium">
                            {staff.eventCount} sự kiện
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {format(new Date(staff.createdAt), "dd/MM/yyyy", { locale: vi })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDetailStaff(staff)}
                          className="w-8 h-8 rounded-lg"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(staff)}
                          className="w-8 h-8 rounded-lg"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openAssign(staff)}
                          className="w-8 h-8 rounded-lg hover:bg-violet-500/10 hover:text-violet-500"
                          title="Phân công sự kiện"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[180px]">
                            <DropdownMenuItem
                              onClick={() => setToggleStaff({ staff, nextActive: !staff.isActive })}
                              className="gap-2 cursor-pointer"
                            >
                              {staff.isActive
                                ? <><Lock className="w-3.5 h-3.5 text-amber-500" /> Khóa tài khoản</>
                                : <><Unlock className="w-3.5 h-3.5 text-emerald-500" /> Mở khóa</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteStaff(staff)}
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa nhân viên
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════ Modals ════════════════════ */}

      {/* ── Create Staff Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-violet-500" />
              </div>
              Thêm nhân viên mới
            </DialogTitle>
            <DialogDescription>
              Tạo tài khoản Staff để nhân viên có thể soát vé tại sự kiện
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">
                Họ và tên <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="rounded-xl h-10"
              />
              {formErrors.name && <p className="text-destructive text-xs">{formErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="nhanvien@email.com"
                type="email"
                className="rounded-xl h-10"
              />
              {formErrors.email && <p className="text-destructive text-xs">{formErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Số điện thoại</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0901234567"
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-2">
                Mật khẩu
                <span className="text-xs text-muted-foreground font-normal">(để trống = tự sinh mật khẩu)</span>
              </Label>
              <Input
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự"
                type="text"
                className="rounded-xl h-10"
              />
              {formErrors.password && <p className="text-destructive text-xs">{formErrors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Ghi chú</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Nhập ghi chú (tuỳ chọn)"
                className="rounded-xl resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl px-6"
            >
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Tạo nhân viên</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Temp Password Modal ── */}
      <Dialog open={!!tempPasswordInfo} onOpenChange={() => setTempPasswordInfo(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
              Tạo tài khoản thành công!
            </DialogTitle>
            <DialogDescription>
              Hãy ghi lại thông tin đăng nhập và gửi cho nhân viên. Mật khẩu sẽ không hiển thị lại.
            </DialogDescription>
          </DialogHeader>

          {tempPasswordInfo && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Tên:</span>
                  <span className="text-foreground font-medium">{tempPasswordInfo.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Email:</span>
                  <span className="text-foreground font-medium text-sm">{tempPasswordInfo.email}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> Mật khẩu tạm:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-400 font-mono text-sm bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {tempPasswordInfo.password}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCopyPassword}
                        className="w-7 h-7 rounded-lg"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                Nhân viên nên đổi mật khẩu sau khi đăng nhập lần đầu. Bạn có thể đổi mật khẩu cho họ bất kỳ lúc nào thông qua nút Chỉnh sửa.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setTempPasswordInfo(null)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl"
            >
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Staff Modal ── */}
      <Dialog open={!!editStaff} onOpenChange={() => setEditStaff(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-violet-500" />
              Chỉnh sửa nhân viên
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho {editStaff?.name || editStaff?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Họ và tên</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Số điện thoại</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0901234567"
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Đổi mật khẩu
                <span className="text-xs text-muted-foreground">(để trống = không đổi)</span>
              </Label>
              <Input
                value={editForm.newPassword}
                onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                type="text"
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Ghi chú</Label>
              <Textarea
                value={editForm.note}
                onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                className="rounded-xl resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditStaff(null)} className="rounded-xl">
              Hủy
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Events Modal ── */}
      <Dialog open={!!assignStaff} onOpenChange={() => setAssignStaff(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-500" />
              Phân công sự kiện
            </DialogTitle>
            <DialogDescription>
              Chọn các sự kiện mà <span className="text-foreground font-medium">{assignStaff?.name || assignStaff?.email}</span> được phép soát vé
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-1">
            {sellerEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Bạn chưa có sự kiện nào</p>
              </div>
            ) : (
              <div className="space-y-2 py-1">
                {sellerEvents.map((ev) => {
                  const selected = selectedEventIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => toggleEventSelect(ev.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150
                        ${selected
                          ? "bg-violet-500/10 border-violet-500/40"
                          : "border-border hover:border-border/80 hover:bg-muted/40"
                        }`}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleEventSelect(ev.id)}
                        className="rounded-md data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(ev.startDate), "dd/MM/yyyy", { locale: vi })}
                          {" · "}
                          {ev.venue}
                        </p>
                      </div>
                      {statusBadge(ev.status)}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Đã chọn <span className="text-foreground font-semibold">{selectedEventIds.length}</span> / {sellerEvents.length} sự kiện
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setAssignStaff(null)} className="rounded-xl">
                Hủy
              </Button>
              <Button
                onClick={() => assignMutation.mutate({ id: assignStaff!.id, eventIds: selectedEventIds })}
                disabled={assignMutation.isPending}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl px-5"
              >
                {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Lưu phân công
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Detail Modal ── */}
      <Dialog open={!!detailStaff} onOpenChange={() => setDetailStaff(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-violet-500" />
              Chi tiết nhân viên
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : staffDetail ? (
            <div className="space-y-5">
              {/* Profile */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                <Avatar className="w-16 h-16 ring-2 ring-violet-500/30">
                  <AvatarImage src={staffDetail.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-xl font-bold">
                    {getInitials(staffDetail.name, staffDetail.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-foreground">{staffDetail.name || "—"}</h3>
                    {staffDetail.isActive ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">Đang hoạt động</Badge>
                    ) : (
                      <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-xs">Đã khóa</Badge>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" /> {staffDetail.email}
                    </div>
                    {staffDetail.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" /> {staffDetail.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Tạo ngày {format(new Date(staffDetail.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </div>
                  </div>
                  {staffDetail.note && (
                    <p className="mt-2 text-sm text-muted-foreground italic">📌 {staffDetail.note}</p>
                  )}
                </div>
              </div>

              {/* Assigned Events with check-in stats */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-500" />
                  Sự kiện được phân công ({staffDetail.assignedEvents?.length || 0})
                </h4>
                {!staffDetail.assignedEvents?.length ? (
                  <div className="text-center py-6 text-muted-foreground text-sm border border-border rounded-xl">
                    Chưa được phân công sự kiện nào
                  </div>
                ) : (
                  <div className="space-y-2">
                    {staffDetail.assignedEvents.map((ev: any) => {
                      const pct = ev.totalTickets > 0 ? Math.round((ev.checkedIn / ev.totalTickets) * 100) : 0;
                      return (
                        <div key={ev.eventId} className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm text-foreground">{ev.eventTitle}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(ev.startDate), "dd/MM/yyyy", { locale: vi })} · {ev.venue}
                              </p>
                            </div>
                            {statusBadge(ev.status)}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {ev.checkedIn}/{ev.totalTickets} ({pct}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Toggle Active Confirm ── */}
      <AlertDialog open={!!toggleStaff} onOpenChange={() => setToggleStaff(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {toggleStaff?.nextActive
                ? <><Unlock className="w-5 h-5 text-emerald-500" /> Mở khóa tài khoản</>
                : <><Lock className="w-5 h-5 text-amber-500" /> Khóa tài khoản</>
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleStaff?.nextActive
                ? `Mở khóa để ${toggleStaff.staff.name || toggleStaff.staff.email} có thể đăng nhập và soát vé trở lại.`
                : `Sau khi khóa, ${toggleStaff?.staff.name || toggleStaff?.staff.email} sẽ không thể đăng nhập vào hệ thống.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleMutation.mutate({ id: toggleStaff!.staff.id, isActive: toggleStaff!.nextActive })}
              className={`rounded-xl ${
                toggleStaff?.nextActive
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-600 hover:bg-amber-700"
              } text-white`}
            >
              {toggleStaff?.nextActive ? "Mở khóa" : "Khóa ngay"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteStaff} onOpenChange={() => setDeleteStaff(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Xóa nhân viên
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xóa{" "}
              <span className="text-foreground font-semibold">{deleteStaff?.name || deleteStaff?.email}</span>{" "}
              khỏi danh sách nhân viên. Nhân viên sẽ mất toàn bộ quyền soát vé. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteStaff!.id)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Xóa nhân viên
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

