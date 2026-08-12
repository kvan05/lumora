"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  MoreHorizontal, 
  Edit, 
  Users, 
  Ticket,
  Eye,
  EyeOff,
  PauseCircle,
  PlayCircle,
  Image as ImageIcon,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export default function SellerEventsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [pauseTargetEvent, setPauseTargetEvent] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["seller-events"],
    queryFn: async () => {
      const res = await api.get("/seller/events");
      return res.data.data.events;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const res = await api.patch(`/events/${eventId}/status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã cập nhật trạng thái bán vé thành công!");
      setIsConfirmOpen(false);
      setPauseTargetEvent(null);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi cập nhật trạng thái sự kiện");
    },
  });

  const filteredEvents = events?.filter((event: any) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPauseModal = (event: any) => {
    setPauseTargetEvent(event);
    setIsConfirmOpen(true);
  };

  const getTicketCounts = (event: any) => {
    let sold = 0;
    let total = 0;
    if (event.ticketTypes && Array.isArray(event.ticketTypes)) {
      event.ticketTypes.forEach((t: any) => {
        total += t.quantity || 0;
        const currentQty = t.inventory?.currentQuantity ?? t.quantity;
        sold += Math.max(0, (t.quantity || 0) - currentQty);
      });
    }
    const remaining = Math.max(0, total - sold);
    return { sold, total, remaining };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Sự kiện của bạn</h2>
          <p className="text-muted-foreground mt-1">Quản lý tất cả các sự kiện và ngưng/mở bán vé sự kiện do bạn quản lý.</p>
        </div>
        <Button className="rounded-xl shadow-sm" asChild>
          <Link href="/seller/events/create">
            <Plus className="mr-2 h-4 w-4" />
            Tạo sự kiện
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm sự kiện..." 
              className="pl-9 h-10 rounded-xl bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px] font-bold text-muted-foreground uppercase tracking-wider text-xs">Sự kiện</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Thời gian & Địa điểm</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Trạng thái</TableHead>
                <TableHead className="font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredEvents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    Không tìm thấy sự kiện nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents?.map((event: any) => (
                  <TableRow key={event.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-muted relative overflow-hidden shrink-0 border border-border/50 flex items-center justify-center">
                          {event.bannerUrl ? (
                            <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <Link href={`/seller/events/${event.id}`} className="font-bold text-base hover:text-primary transition-colors line-clamp-1">
                            {event.title}
                          </Link>
                          <Badge variant="outline" className="mt-1 text-[10px] uppercase font-semibold">
                            {event.category}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{format(new Date(event.startDate), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{event.venue}, {event.city}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.status === "PUBLISHED" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none px-2.5 py-1 rounded-full font-bold">
                          <Eye className="w-3.5 h-3.5 mr-1" /> Đã duyệt & Mở bán
                        </Badge>
                      ) : event.status === "PAUSED" ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none px-2.5 py-1 rounded-full font-bold">
                          <PauseCircle className="w-3.5 h-3.5 mr-1" /> Ngưng bán
                        </Badge>
                      ) : event.status === "PENDING_APPROVAL" ? (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none px-2.5 py-1 rounded-full font-bold">
                          <EyeOff className="w-3.5 h-3.5 mr-1" /> Chờ Admin duyệt
                        </Badge>
                      ) : event.status === "REJECTED" ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none px-2.5 py-1 rounded-full font-bold">
                          Bị từ chối
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-none px-2.5 py-1 rounded-full font-bold">
                          <EyeOff className="w-3.5 h-3.5 mr-1" /> Bản nháp
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {event.status === "PUBLISHED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 gap-1"
                            onClick={() => handleOpenPauseModal(event)}
                          >
                            <PauseCircle className="h-3.5 w-3.5" /> Ngưng bán vé
                          </Button>
                        )}
                        {event.status === "PAUSED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 gap-1"
                            onClick={() => handleOpenPauseModal(event)}
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> Mở bán lại
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-md">
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/seller/events/${event.id}`}>
                                <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                                Quản lý chi tiết
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link href={`/events/${event.slug || event.id}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                Xem trên web
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {event.status === "PUBLISHED" && (
                              <DropdownMenuItem className="cursor-pointer text-amber-600 font-semibold" onClick={() => handleOpenPauseModal(event)}>
                                <PauseCircle className="mr-2 h-4 w-4" />
                                Ngưng bán vé
                              </DropdownMenuItem>
                            )}
                            {event.status === "PAUSED" && (
                              <DropdownMenuItem className="cursor-pointer text-emerald-600 font-semibold" onClick={() => handleOpenPauseModal(event)}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Mở bán lại
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {event.hasSeatMap ? (
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/seller/events/${event.id}/seats`}>
                                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Quản lý sơ đồ ghế
                                </Link>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/seller/events/${event.id}`}>
                                  <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Quản lý loại vé
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Confirmation Dialog for Pause/Resume Sales */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {pauseTargetEvent?.status === "PAUSED" ? "Xác Nhận Mở Bán Vé Tải Lại" : "Xác Nhận Ngưng Bán Vé Sự Kiện"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {pauseTargetEvent?.status === "PAUSED"
                ? "Mở lại khả năng đặt vé mới cho người mua trên hệ thống."
                : "Tạm dừng cho phép khách hàng đặt mua vé mới. Các vé đã bán trước đó vẫn giữ nguyên giá trị."}
            </DialogDescription>
          </DialogHeader>

          {pauseTargetEvent && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-muted/40 p-4 rounded-xl border space-y-1.5">
                <p className="text-sm font-extrabold text-foreground">{pauseTargetEvent.title}</p>
                <div className="flex justify-between items-center pt-2 text-muted-foreground">
                  <span>Số vé đã bán:</span>
                  <span className="font-extrabold text-emerald-600">{getTicketCounts(pauseTargetEvent).sold} vé</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Số vé còn lại:</span>
                  <span className="font-extrabold text-primary">{getTicketCounts(pauseTargetEvent).remaining} vé</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => setIsConfirmOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              className={`rounded-xl text-xs font-bold ${
                pauseTargetEvent?.status === "PAUSED"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
              onClick={() => {
                if (!pauseTargetEvent) return;
                const nextStatus = pauseTargetEvent.status === "PAUSED" ? "PUBLISHED" : "PAUSED";
                toggleStatusMutation.mutate({ eventId: pauseTargetEvent.id, status: nextStatus });
              }}
              disabled={toggleStatusMutation.isPending}
            >
              {toggleStatusMutation.isPending
                ? "Đang xử lý..."
                : pauseTargetEvent?.status === "PAUSED"
                ? "Xác Nhận Mở Bán"
                : "Xác Nhận Ngưng Bán"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

