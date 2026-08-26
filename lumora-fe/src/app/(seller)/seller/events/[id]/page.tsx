"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { 
  Ticket, 
  Plus, 
  Settings, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Send,
  Clock,
  Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ticketSchema = z.object({
  name: z.string().min(2, "Tên loại vé quá ngắn"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Giá không được âm"),
  capacity: z.coerce.number().min(1, "Số lượng phải lớn hơn 0"),
  maxPerUser: z.coerce.number().min(1, "Giới hạn mua phải lớn hơn 0"),
});

export default function SellerEventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [newTicketEventDate, setNewTicketEventDate] = useState<string>("");

  // Fetch all seller events to get the specific event
  const { data: event, isLoading: isLoadingEvent, refetch: refetchEvent } = useQuery({
    queryKey: ["seller-event", eventId],
    queryFn: async () => {
      const res = await api.get("/seller/events");
      const foundEvent = res.data.data.events.find((e: any) => e.id === eventId);
      if (!foundEvent) throw new Error("Event not found");
      return foundEvent;
    },
  });

  // Fetch ticket types for this event
  const { data: ticketTypes, isLoading: isLoadingTickets, refetch: refetchTickets } = useQuery({
    queryKey: ["event-tickets", eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}/tickets`);
      return res.data.data;
    },
  });

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      capacity: 100,
      maxPerUser: 4,
    },
  });

  async function onCreateTicket(values: z.infer<typeof ticketSchema>) {
    setIsSubmitting(true);
    try {
      const payload: any = {
        ...values,
        quantity: values.capacity,
        maxPerOrder: values.maxPerUser,
      };
      // Only include eventDate if it has a value
      if (newTicketEventDate) payload.eventDate = newTicketEventDate;
      await api.post(`/events/${eventId}/tickets`, payload);
      toast.success("Thêm loại vé thành công!");
      setIsAddingTicket(false);
      setNewTicketEventDate("");
      form.reset();
      refetchTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Lỗi khi thêm loại vé");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onTogglePublish(targetStatus: string) {
    setIsPublishing(true);
    try {
      await api.patch(`/events/${eventId}/status`, { status: targetStatus });
      toast.success(targetStatus === "PUBLISHED" ? "Đã xuất bản sự kiện!" : "Đã cập nhật trạng thái sự kiện thành công!");
      refetchEvent();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Lỗi khi đổi trạng thái sự kiện");
    } finally {
      setIsPublishing(false);
    }
  }

  if (isLoadingEvent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-20">Không tìm thấy sự kiện.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{event.title}</h2>
            {event.status === "PUBLISHED" ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-none font-bold">🚀 Đã Xuất Bản</Badge>
            ) : event.status === "PAUSED" ? (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-none font-bold">⏸ Tạm Dừng</Badge>
            ) : event.status === "HIDDEN" ? (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-none font-bold">🔒 Bị Ẩn Bởi Admin</Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none font-bold">📝 Bản Nháp</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin và các loại vé cho sự kiện này.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" className="rounded-xl shadow-sm border-border text-foreground hover:bg-muted" onClick={() => router.push(`/seller/events/${eventId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Sửa thông tin
          </Button>

          {event.status === "PUBLISHED" ? (
            <Button
              variant="outline"
              className="rounded-xl shadow-sm border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold"
              onClick={() => onTogglePublish("PAUSED")}
              disabled={isPublishing}
            >
              ⏸ Tạm dừng mở bán
            </Button>
          ) : event.status === "PAUSED" ? (
            <Button
              className="rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
              onClick={() => onTogglePublish("PUBLISHED")}
              disabled={isPublishing}
            >
              🚀 Mở bán lại
            </Button>
          ) : (
            <Button
              className="rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
              onClick={() => onTogglePublish("PUBLISHED")}
              disabled={isPublishing}
            >
              <Send className="mr-2 h-4 w-4" />
              Xuất bản sự kiện
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="bg-muted/10 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quản lý Loại Vé</CardTitle>
            </div>
            {!event.hasSeatMap && (
              <Dialog open={isAddingTicket} onOpenChange={setIsAddingTicket}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full shadow-sm">
                    <Plus className="h-4 w-4 mr-1" /> Thêm loại vé
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Thêm Loại Vé Mới</DialogTitle>
                    <DialogDescription>
                      Thiết lập tên, giá và số lượng cho loại vé này.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateTicket as any)} className="space-y-4">
                      <FormField
                        control={form.control as any}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên loại vé</FormLabel>
                            <FormControl>
                              <Input placeholder="VD: Vé VIP, Vé Thường..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mô tả (Tùy chọn)</FormLabel>
                            <FormControl>
                              <Input placeholder="Quyền lợi đi kèm..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control as any}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Giá vé (VNĐ)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control as any}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Số lượng tổng</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control as any}
                        name="maxPerUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giới hạn mua / Người</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* eventDate field - only shown for multi-day events */}
                      {event?.startDate && event?.endDate &&
                        new Date(event.startDate).toDateString() !== new Date(event.endDate).toDateString() && (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> Ngày áp dụng vé
                              <span className="text-muted-foreground font-normal text-xs">(tùy chọn - để trống = mọi ngày)</span>
                            </FormLabel>
                            <Input
                              type="date"
                              value={newTicketEventDate}
                              min={new Date(event.startDate).toISOString().split("T")[0]}
                              max={new Date(event.endDate).toISOString().split("T")[0]}
                              onChange={(e) => setNewTicketEventDate(e.target.value)}
                            />
                            {newTicketEventDate && (
                              <p className="text-xs text-primary/80 font-semibold">
                                ✓ Vé chỉ dùng cho ngày {new Date(newTicketEventDate + "T00:00:00").toLocaleDateString("vi-VN")}
                              </p>
                            )}
                          </FormItem>
                        )}
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting} className="rounded-xl w-full">
                          {isSubmitting ? "Đang lưu..." : "Xác nhận tạo"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {event.hasSeatMap ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sự kiện sử dụng Sơ đồ ghế</h3>
                <p className="text-muted-foreground text-sm mt-1">Bạn cần thiết lập các khu vực và ghế ngồi trên bản đồ thay vì tạo loại vé cơ bản.</p>
              </div>
              <Button className="rounded-xl" onClick={() => router.push(`/seller/events/${eventId}/seats`)}>
                Đến trình Quản lý sơ đồ ghế
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-bold">Loại Vé</TableHead>
                  <TableHead className="font-bold">Ngày</TableHead>
                  <TableHead className="font-bold text-right">Giá</TableHead>
                  <TableHead className="font-bold text-center">Số lượng</TableHead>
                  <TableHead className="font-bold text-center">Đã bán</TableHead>
                  <TableHead className="font-bold text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTickets ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell>
                  </TableRow>
                ) : ticketTypes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 opacity-50" />
                        <p>Chưa có loại vé nào được tạo.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  ticketTypes?.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="font-bold">{ticket.name}</div>
                        {ticket.description && <div className="text-xs text-muted-foreground">{ticket.description}</div>}
                      </TableCell>
                      <TableCell>
                        {ticket.eventDate ? (
                          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-semibold text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(ticket.eventDate).toLocaleDateString("vi-VN")}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Mọi ngày</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {Number(ticket.price).toLocaleString("vi-VN")} ₫
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{ticket.inventory?.totalQty || ticket.quantity || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {(ticket.inventory?.soldQty || 0) + (ticket.inventory?.reservedQty || 0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
