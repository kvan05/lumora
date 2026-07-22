"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Calendar, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Ticket, 
  Zap, 
  Gift 
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch featured events
  const { data: featuredEvents, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ["featured-events"],
    queryFn: async () => {
      const res = await api.get("/events/featured");
      return res.data.data;
    },
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["event-categories"],
    queryFn: async () => {
      const res = await api.get("/events/categories");
      return res.data.data;
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/events");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative bg-linear-to-b from-primary/20 via-background to-background py-20 md:py-32 px-4 overflow-hidden">
        {/* Decorative pastel circles */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent/20 blur-3xl -z-10" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl -z-10" />
        
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-foreground text-xs md:text-sm font-semibold animate-pulse">
            <Sparkles className="h-4 w-4 text-primary" />
            Nền tảng đặt vé sự kiện hiện đại và an toàn
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Thắp sáng những <br className="hidden sm:inline" />
            <span className="text-primary bg-linear-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
              Khoảnh khắc tuyệt vời
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Khám phá, đặt vé và tận hưởng những sự kiện âm nhạc, văn hóa, thể thao đỉnh cao xung quanh bạn với công nghệ soát vé QR tiện lợi.
          </p>

          {/* Search Box */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto p-2 rounded-2xl bg-card border border-border/80 shadow-md backdrop-blur-sm"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm sự kiện, nghệ sĩ, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 border-none focus-visible:ring-0 shadow-none bg-transparent h-12 text-base w-full"
              />
            </div>
            <Button type="submit" size="lg" className="rounded-xl px-6 h-12 shadow-sm font-bold bg-primary text-primary-foreground hover:opacity-90">
              Tìm kiếm
            </Button>
          </form>

          {/* Popular Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="text-sm text-muted-foreground mr-2">Khám phá nhanh:</span>
            {isLoadingCategories ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)
            ) : (
              categories?.map((cat: any) => (
                <Link key={cat.name} href={`/events?category=${encodeURIComponent(cat.name)}`}>
                  <Badge variant="secondary" className="hover:bg-primary hover:text-white transition-colors cursor-pointer text-sm py-1 px-3 rounded-full">
                    {cat.name} ({cat.count})
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 2. Featured Events Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl space-y-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                Sự kiện nổi bật
              </h2>
              <p className="text-muted-foreground mt-1">Những sự kiện nóng hổi đang được săn đón nhiều nhất.</p>
            </div>
            <Button variant="ghost" className="rounded-full font-bold group text-primary shrink-0" asChild>
              <Link href="/events">
                Xem tất cả <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {isLoadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-56 w-full rounded-2xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : !featuredEvents || featuredEvents.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-card/20 border-border/60">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3" />
              <p className="text-muted-foreground font-semibold">Chưa có sự kiện nổi bật nào hoạt động</p>
              <Button className="mt-4 rounded-full" asChild>
                <Link href="/events">Khám phá tất cả sự kiện</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event: any) => {
                const eventDate = new Date(event.startDate);
                
                return (
                  <Link key={event.id} href={`/events/${event.slug || event.id}`} className="group">
                    <Card className="h-full border border-border/50 hover:border-primary/50 overflow-hidden shadow-xs hover:shadow-lg transition-all rounded-2xl bg-card/50 hover:bg-card">
                      {/* Image container */}
                      <div className="relative h-56 bg-muted overflow-hidden">
                        {event.bannerUrl ? (
                          <Image
                            src={event.bannerUrl}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                            {event.title.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-background/85 text-foreground backdrop-blur-sm border-none shadow-sm rounded-full py-0.5 px-3">
                            {event.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Card Content */}
                      <CardContent className="p-6 space-y-4">
                        <h3 className="font-extrabold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                          {event.title}
                        </h3>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4.5 w-4.5 text-secondary-foreground/60 shrink-0" />
                            <span>{format(eventDate, "EEEE, d MMMM, yyyy", { locale: vi })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4.5 w-4.5 text-secondary-foreground/60 shrink-0" />
                            <span className="line-clamp-1">{event.venue}, {event.city}</span>
                          </div>
                        </div>

                        <div className="border-t pt-4 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Giá vé từ</span>
                            <span className="font-extrabold text-primary text-lg">
                              {event.minPrice ? `${Number(event.minPrice).toLocaleString("vi-VN")} ₫` : "Đang cập nhật"}
                            </span>
                          </div>
                          <Button size="sm" className="rounded-full shadow-sm">
                            Mua vé ngay
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section className="py-16 px-4 bg-muted/20 border-t border-b">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-extrabold text-center text-foreground tracking-tight mb-12">
            Trải nghiệm đặt vé thông minh cùng Lumora
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border/40 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">Giữ chỗ 15 phút</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Hệ thống tự động khóa chỗ và giữ vé trong vòng 15 phút, giúp bạn thong thả thực hiện thanh toán mà không sợ bị người khác tranh mua.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border/40 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">Thanh toán VietQR an toàn</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tích hợp cổng VietQR (PayOS) giúp bạn quét mã thanh toán chuyển khoản tức thì và tự động xác nhận đặt vé thành công chỉ trong vài giây.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border/40 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 bg-accent/20 text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-2">
                <Ticket className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">Vé điện tử QR tiện lợi</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Mã vé điện tử được lưu trực tiếp trong tài khoản của bạn dưới dạng thẻ QR check-in tiện lợi, sẵn sàng xuất trình tại cổng soát vé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Seller Call to Action */}
      <section className="py-20 px-4 bg-linear-to-r from-primary/10 to-accent/15 text-center">
        <div className="container mx-auto max-w-3xl space-y-6">
          <div className="w-12 h-12 bg-accent/30 rounded-full flex items-center justify-center mx-auto text-primary">
            <Gift className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            Bạn là Nhà tổ chức sự kiện?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Lumora cung cấp hệ thống quản lý sơ đồ ghế chuyên nghiệp, thống kê doanh thu thời gian thực và quản lý check-in sự kiện dễ dàng.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full font-bold shadow-md bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto" asChild>
              <Link href="/seller/dashboard">Đăng sự kiện của bạn</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full font-bold w-full sm:w-auto" asChild>
              <Link href="/register">Đăng ký tài khoản</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
