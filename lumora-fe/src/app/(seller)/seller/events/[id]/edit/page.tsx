"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  "Nhạc sống",
  "Sân khấu & Nghệ thuật",
  "Thể thao",
  "Hội thảo & Học tập",
  "Cộng đồng & Văn hóa",
  "Khác",
];

const eventEditSchema = z.object({
  title: z.string().min(5, "Tên sự kiện phải có ít nhất 5 ký tự"),
  category: z.string().min(1, "Vui lòng chọn danh mục"),
  venue: z.string().min(2, "Địa điểm không được để trống"),
  address: z.string().min(5, "Địa chỉ chi tiết không được để trống"),
  city: z.string().min(2, "Thành phố không được để trống"),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  bannerUrl: z.string().optional(),
  description: z.string().min(20, "Mô tả chi tiết phải có ít nhất 20 ký tự"),
});

export default function SellerEditEventPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all seller events to find the specific event
  const { data: event, isLoading, refetch } = useQuery({
    queryKey: ["seller-event-edit", eventId],
    queryFn: async () => {
      const res = await api.get("/seller/events");
      const found = res.data.data.events.find((e: any) => e.id === eventId);
      if (!found) throw new Error("Sự kiện không tồn tại");
      return found;
    },
  });

  const form = useForm<z.infer<typeof eventEditSchema>>({
    resolver: zodResolver(eventEditSchema) as any,
    defaultValues: {
      title: "",
      category: "",
      venue: "",
      address: "",
      city: "",
      startDate: "",
      endDate: "",
      bannerUrl: "",
      description: "",
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title || "",
        category: event.category || "",
        venue: event.venue || "",
        address: event.address || "",
        city: event.city || "",
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
        bannerUrl: event.bannerUrl || "",
        description: event.description || "",
      });
    }
  }, [event, form]);

  async function onSubmit(values: z.infer<typeof eventEditSchema>) {
    setIsSubmitting(true);
    try {
      const res = await api.put(`/events/${eventId}`, values);
      if (res.data?.success) {
        if (res.data.isEditRequest) {
          toast.success(res.data.message || "Đã gửi yêu cầu chỉnh sửa sự kiện đến Admin để xét duyệt!");
        } else {
          toast.success(res.data.message || "Cập nhật thông tin sự kiện thành công!");
        }
        refetch();
        router.push(`/seller/events/${eventId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Không thể cập nhật thông tin sự kiện.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-20">Không tìm thấy sự kiện.</div>;
  }

  const isPublished = event.status === "PUBLISHED";
  const isPendingEdit = event.editRequestStatus === "PENDING_REVIEW";

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="rounded-xl gap-2 text-sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs px-3 py-1 font-bold ${
            isPublished ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}>
            {isPublished ? "Đã Mở Bán (Published)" : "Chưa Duyệt / Bản Nháp"}
          </Badge>
        </div>
      </div>

      {/* Edit Rule Alert Banner */}
      {isPublished ? (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900 rounded-2xl dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-bold">Quy định chỉnh sửa sự kiện đã mở bán</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed mt-1">
            Sự kiện này đã mở bán vé công khai. Để bảo vệ quyền lợi người mua vé, các thay đổi thông tin sẽ được đóng gói thành <strong>Yêu cầu chỉnh sửa</strong> gửi tới Admin để xét duyệt trước khi áp dụng chính thức.
            {isPendingEdit && (
              <span className="block mt-2 font-bold text-amber-700 dark:text-amber-300">
                ⏳ Bạn đang có 1 yêu cầu chỉnh sửa đang chờ Admin xét duyệt. Việc gửi biểu mẫu mới này sẽ cập nhật lại nội dung yêu cầu của bạn.
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 rounded-2xl dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="font-bold">Chỉnh sửa tự do</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed mt-1">
            Sự kiện chưa được duyệt/mở bán. Bạn có thể tự do thay đổi toàn bộ thông tin và lưu cập nhật ngay lập tức.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-xl font-bold">
            {isPublished ? "Tạo Yêu Cầu Chỉnh Sửa Thông Tin" : "Chỉnh Sửa Thông Tin Sự Kiện"}
          </CardTitle>
          <CardDescription>
            {isPublished
              ? "Điền thông tin mới muốn thay đổi. Sau khi nhấn gửi, yêu cầu sẽ được gửi tới Admin."
              : "Cập nhật lại thông tin sự kiện của bạn."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
              <FormField
                control={form.control as any}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Tên sự kiện *</FormLabel>
                    <FormControl>
                      <Input placeholder="Tên sự kiện nổi bật..." className="rounded-xl h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Danh mục *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-11">
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Tỉnh / Thành phố *</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Hồ Chí Minh, Hà Nội..." className="rounded-xl h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Tên địa điểm *</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Nhà thi đấu Nguyễn Du..." className="rounded-xl h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Địa chỉ chi tiết *</FormLabel>
                      <FormControl>
                        <Input placeholder="Số nhà, đường, phường/xã..." className="rounded-xl h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Ngày & Giờ bắt đầu *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="rounded-xl h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Ngày & Giờ kết thúc *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="rounded-xl h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control as any}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Link Ảnh Banner (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/banner.jpg" className="rounded-xl h-11" {...field} />
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
                    <FormLabel className="font-bold">Mô tả chi tiết sự kiện *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Chi tiết nội dung chương trình, dàn nghệ sĩ..." className="rounded-xl min-h-[140px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()}>
                  Hủy bỏ
                </Button>
                <Button type="submit" className="rounded-xl font-bold bg-primary px-6" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Đang xử lý..."
                  ) : isPublished ? (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Gửi Yêu Cầu Chỉnh Sửa Cho Admin
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Lưu Cập Nhật Ngay
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
