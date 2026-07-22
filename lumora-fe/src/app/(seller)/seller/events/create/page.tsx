"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, MapPin, Calendar, Type, Map, Armchair } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(5, "Tên sự kiện phải có ít nhất 5 ký tự"),
  description: z.string().min(20, "Mô tả quá ngắn"),
  category: z.string().min(1, "Vui lòng nhập danh mục"),
  venue: z.string().min(1, "Vui lòng nhập tên địa điểm"),
  address: z.string().min(1, "Vui lòng nhập địa chỉ"),
  city: z.string().min(1, "Vui lòng nhập thành phố"),
  startDate: z.string().min(1, "Vui lòng chọn thời gian bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn thời gian kết thúc"),
  hasSeatMap: z.boolean().default(false),
});

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: "",
      venue: "",
      address: "",
      city: "",
      startDate: "",
      endDate: "",
      hasSeatMap: false,
    },
  });

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    setIsSubmitting(true);
    try {
      const res = await api.post("/events", values);
      if (res.data.success) {
        toast.success("Tạo sự kiện thành công!");
        const eventId = res.data.data.id;
        
        if (values.hasSeatMap) {
          router.push(`/seller/events/${eventId}/seats`);
        } else {
          router.push(`/seller/events/${eventId}`);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Tạo sự kiện thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Tạo Sự Kiện Mới 🎉</h2>
        <p className="text-muted-foreground mt-1">
          Điền các thông tin dưới đây để tạo trang bán vé cho sự kiện của bạn.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
          
          {/* Thông tin cơ bản */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              </div>
              <CardDescription>Tên, mô tả và phân loại sự kiện của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control as any}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Tên sự kiện</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Lễ hội Âm nhạc Mùa hè 2026..." className="h-11 rounded-xl" {...field} />
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
                    <FormLabel className="font-semibold">Mô tả chi tiết</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Viết một mô tả thật hấp dẫn để thu hút người mua vé..." 
                        className="min-h-[120px] rounded-xl resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control as any}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Danh mục</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Âm nhạc, Thể thao, Hội thảo..." className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Địa điểm & Thời gian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-blue-500/5 pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Địa điểm tổ chức</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <FormField
                  control={form.control as any}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Tên địa điểm</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Sân vận động Mỹ Đình" className="h-11 rounded-xl" {...field} />
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
                      <FormLabel className="font-semibold">Địa chỉ cụ thể</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: 1 Lê Đức Thọ, Nam Từ Liêm" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Thành phố</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Hà Nội" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-orange-500/5 pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">Thời gian</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <FormField
                  control={form.control as any}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Bắt đầu lúc</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="h-11 rounded-xl" {...field} />
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
                      <FormLabel className="font-semibold">Kết thúc lúc</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" className="h-11 rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-xl bg-orange-50 dark:bg-orange-900/10 p-4 border border-orange-200 dark:border-orange-900/30 flex gap-3 text-sm text-orange-800 dark:text-orange-300">
                  <Info className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>Hãy đảm bảo thời gian kết thúc phải diễn ra sau thời gian bắt đầu của sự kiện.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cấu hình vé */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-purple-500/5 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Armchair className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Loại hình đặt vé</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField
                control={form.control as any}
                name="hasSeatMap"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between rounded-xl border border-purple-200/50 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10 p-5 shadow-sm transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    <div className="space-y-1.5">
                      <FormLabel className="text-base font-bold flex items-center gap-2">
                        Sử dụng Sơ đồ ghế (Seat Map)
                        {field.value && <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Đang Bật</span>}
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Bật tính năng này nếu bạn muốn khách hàng tự chọn vị trí ghế ngồi cụ thể (ví dụ: A1, B2) trên bản đồ sân khấu.
                        Nếu tắt, khách hàng chỉ chọn số lượng vé theo loại (VD: Vé VIP x2).
                      </FormDescription>
                    </div>
                    <FormControl>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={field.value} 
                          onChange={field.onChange} 
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-border/40">
            <Button type="button" variant="ghost" className="rounded-xl h-11" onClick={() => router.back()}>
              Hủy bỏ
            </Button>
            <Button type="submit" className="rounded-xl h-11 font-bold px-8 shadow-sm" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Tạo Sự Kiện"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
