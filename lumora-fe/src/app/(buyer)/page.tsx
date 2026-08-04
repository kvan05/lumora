"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Ticket, 
  Zap, 
  ShieldCheck, 
  Flame,
  QrCode
} from "lucide-react";

// Fallback Banner slides for Hero Carousel
const HERO_BANNERS = [
  {
    id: "banner-1",
    title: "XOAY TRÒN DAY 3",
    subtitle: "Vinhomes Ocean Park 3, Hưng Yên",
    time: "19:00 - 06.09.2026",
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    slug: "xoay-tron-day-3",
  },
  {
    id: "banner-2",
    title: "PICKLEBALL WORLD CUP 2026",
    subtitle: "Tien Son Sport Center, Danang, Vietnam",
    time: "AUG 30TH TO SEP 6TH",
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    slug: "pickleball-world-cup-2026",
  },
  {
    id: "banner-3",
    title: "LUMORA MUSIC FESTIVAL 2026",
    subtitle: "Sân vận động Quốc gia Mỹ Đình, Hà Nội",
    time: "20:00 - 15.10.2026",
    bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    slug: "lumora-music-festival",
  },
];

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch featured events
  const { data: featuredEventsData, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ["featured-events"],
    queryFn: async () => {
      const res = await api.get("/events/featured");
      const data = res.data.data;
      return Array.isArray(data) ? data : data?.events || [];
    },
  });

  // Fetch all events for listing
  const { data: allEventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["all-events-home"],
    queryFn: async () => {
      const res = await api.get("/events?limit=8");
      const data = res.data.data;
      return Array.isArray(data) ? data : data?.events || [];
    },
  });

  const featuredEvents = Array.isArray(featuredEventsData) ? featuredEventsData : [];
  const allEvents = Array.isArray(allEventsData) ? allEventsData : [];

  // Auto advance slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? HERO_BANNERS.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_BANNERS.length);
  };

  const activeBanners = (featuredEvents && featuredEvents.length > 0)
    ? featuredEvents
    : (allEvents && allEvents.length > 0)
    ? allEvents
    : [
        {
          id: "welcome-banner",
          title: "CHÀO MỪNG BẠN ĐẾN VỚI LUMORA 🎉",
          subtitle: "Hãy đăng nhập tài khoản Seller để bắt đầu tạo và bán vé sự kiện thật của bạn ngay hôm nay!",
          bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
          slug: "seller/events/create",
        }
      ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* ── 1. Hero Dual-Card Banner Carousel (Bright Sky Blue + Pastel Fresh Accent) ── */}
      <section className="relative py-8 md:py-12 bg-linear-to-b from-[#EBF4FA] via-[#FAF7F2] to-[#FAF7F2] dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 overflow-hidden">
        
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Dual Slide Container */}
          <div className="relative group">
            
            {/* Left Nav Arrow */}
            <button
              onClick={prevSlide}
              className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-[#93C453] text-slate-800 dark:text-slate-100 hover:text-slate-900 flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700 shadow-xl opacity-90 hover:scale-110"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Right Nav Arrow */}
            <button
              onClick={nextSlide}
              className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-[#93C453] text-slate-800 dark:text-slate-100 hover:text-slate-900 flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700 shadow-xl opacity-90 hover:scale-110"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Single Large Featured Banner Layout */}
            {(() => {
              const banner = activeBanners[currentSlide % activeBanners.length];
              const bannerImage = banner?.bannerUrl || HERO_BANNERS[currentSlide % HERO_BANNERS.length].bannerUrl;
              const title = banner?.title || HERO_BANNERS[currentSlide % HERO_BANNERS.length].title;
              const subtitle = banner?.venue ? `${banner.venue}, ${banner.city}` : HERO_BANNERS[currentSlide % HERO_BANNERS.length].subtitle;
              const linkSlug = banner?.slug || banner?.id || HERO_BANNERS[currentSlide % HERO_BANNERS.length].slug;

              return (
                <div
                  onClick={() => router.push(`/events/${linkSlug}`)}
                  className="relative w-full h-[320px] sm:h-[400px] md:h-[450px] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-2xl group/card cursor-pointer transition-transform duration-500 hover:scale-[1.005]"
                >
                  {/* Background Image */}
                  <Image
                    src={bannerImage}
                    alt={title}
                    fill
                    priority
                    className="object-cover group-hover/card:scale-105 transition-transform duration-700"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />

                  {/* Badge top right */}
                  <div className="absolute top-6 right-6 z-10">
                    <Badge className="bg-[#EB5B95] text-white font-extrabold text-xs md:text-sm px-4 py-1.5 rounded-full shadow-lg border-none">
                      NỔI BẬT
                    </Badge>
                  </div>

                  {/* Content & Action Button bottom */}
                  <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                        {title}
                      </h3>
                      {subtitle && (
                        <p className="text-slate-200 text-sm md:text-base font-bold drop-shadow-sm line-clamp-1">
                          📍 {subtitle}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/events/${linkSlug}`);
                      }}
                      size="lg"
                      className="bg-white dark:bg-slate-800 hover:bg-[#93C453] text-slate-900 dark:text-slate-100 hover:text-slate-900 font-extrabold rounded-2xl px-6 h-12 shadow-2xl transition-all shrink-0 text-base"
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* Dots Indicator */}
            <div className="flex items-center justify-center gap-2 pt-6">
              {activeBanners.map((item: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? "w-8 bg-[#93C453]" : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. Trending & Popular Events Grid (Fresh Clean Bright / Dark Slate Cards) ── */}
      <section className="py-14 px-4 bg-[#FAF7F2] dark:bg-slate-950">
        <div className="container mx-auto max-w-7xl space-y-10">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-[#EB5B95] fill-[#EB5B95]" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Sự kiện đang bán vé 🔥
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-[#93C453] text-[#4A7C59] dark:text-[#93C453] hover:bg-[#93C453] hover:text-slate-900 font-bold rounded-full text-xs"
            >
              <Link href="/events">Xem tất cả</Link>
            </Button>
          </div>

          {isLoadingEvents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-60 w-full rounded-2xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : !allEvents || allEvents.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
              <Ticket className="h-12 w-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold">Chưa có sự kiện nào được tạo</p>
              <Button className="mt-4 rounded-full bg-[#93C453] text-slate-900 hover:bg-[#82B342] font-bold" asChild>
                <Link href="/seller/events/create">Tạo sự kiện ngay</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allEvents.map((event: any) => {
                return (
                  <Link key={event.id} href={`/events/${event.slug || event.id}`} className="group block">
                    <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden shadow-md group-hover:shadow-2xl group-hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/80 dark:border-slate-800 bg-slate-900">
                      {event.bannerUrl ? (
                        <Image
                          src={event.bannerUrl}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#A8C7DC]/40 flex items-center justify-center font-black text-white text-3xl">
                          {event.title.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      {/* Category Badge */}
                      <Badge className="absolute top-3.5 left-3.5 bg-[#93C453] text-slate-900 shadow-md text-xs px-3 py-1 rounded-full font-extrabold border-none z-10">
                        {event.category || "Sự kiện"}
                      </Badge>

                      {/* Hover Overlay with CTA */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5 z-10">
                        <div className="text-white space-y-1.5">
                          <h4 className="font-extrabold text-base leading-snug line-clamp-2 text-white">{event.title}</h4>
                          <p className="text-xs text-[#93C453] font-black flex items-center gap-1">
                            Bấm để xem chi tiết sự kiện <ChevronRight className="h-3.5 w-3.5" />
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Value Propositions (Giữ chỗ 15 phút, VietQR, QR Check-in) ── */}
      <section className="py-14 px-4 bg-[#EBF4FA] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#93C453]/20 text-[#4A7C59] dark:text-[#93C453] flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Giữ chỗ 15 phút</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Tự động giữ vị trí ghế và vé trong 15 phút giúp bạn thoải mái quét mã thanh toán VietQR.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#A8C7DC]/30 text-[#2C4A60] dark:text-[#A8C7DC] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Thanh toán PayOS VietQR</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Thanh toán chuyển khoản ngân hàng bằng mã QR tự động xác thực trong vài giây.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#EB5B95]/20 text-[#EB5B95] flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">E-Ticket & Check-in QR</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Vé điện tử gửi trực tiếp qua Email và App với mã QR mã hóa an toàn chống vé giả.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
