"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Zap,
  ShieldCheck,
  Flame,
  QrCode,
  TrendingUp,
  Star,
  ChevronRight as ArrowRight,
} from "lucide-react";

/* ─── Fallback banners ────────────────────────────────────────────────── */
const HERO_BANNERS = [
  {
    id: "banner-1",
    title: "XOAY TRÒN DAY 3",
    subtitle: "Vinhomes Ocean Park 3, Hưng Yên",
    time: "19:00 · 06.09.2026",
    bannerUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    slug: "xoay-tron-day-3",
  },
  {
    id: "banner-2",
    title: "PICKLEBALL WORLD CUP 2026",
    subtitle: "Tien Son Sport Center, Đà Nẵng",
    time: "30.08 – 06.09.2026",
    bannerUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    slug: "pickleball-world-cup-2026",
  },
  {
    id: "banner-3",
    title: "LUMORA MUSIC FESTIVAL 2026",
    subtitle: "Sân vận động Mỹ Đình, Hà Nội",
    time: "20:00 · 15.10.2026",
    bannerUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    slug: "lumora-music-festival",
  },
];

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function formatPrice(event: any): string | null {
  const minPrice = event.minPrice ?? event.ticketTypes?.[0]?.price;
  if (!minPrice && minPrice !== 0) return null;
  if (minPrice === 0) return "Miễn phí";
  return `Từ ${Number(minPrice).toLocaleString("vi-VN")}₫`;
}

function formatEventDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
}

/* ─── EventCard (horizontal scroll variant) ───────────────────────────── */
function EventCardHScroll({ event }: { event: any }) {
  const router = useRouter();
  const href = `/events/${event.slug || event.id}`;
  const price = formatPrice(event);

  return (
    <Link
      href={href}
      className="shrink-0 w-[230px] sm:w-[250px] md:w-[280px] relative aspect-[16/9] group block rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm hover:shadow-xl active:scale-[0.98] transition-all duration-300"
    >
      {/* Full Image */}
      {event.bannerUrl ? (
        <Image
          src={event.bannerUrl}
          alt={event.title}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center">
          <span className="text-white font-black text-3xl">
            {event.title.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {/* Category Badge always visible */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
        {event.category && (
          <Badge className="bg-[#93C453] text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border-none shadow-md">
            {event.category}
          </Badge>
        )}
        {event.canPurchase === false && (
          <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-none shadow-md bg-red-600/90 text-white">
            Đã kết thúc
          </Badge>
        )}
      </div>

      {/* Hover Info Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4 z-10">
        <div className="translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-extrabold text-sm sm:text-base leading-snug line-clamp-2 drop-shadow-md">
            {event.title}
          </h3>
          {(event.venue || event.city) && (
            <p className="text-slate-300 text-[11px] sm:text-[12px] flex items-center gap-1 mt-1.5 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {[event.venue, event.city].filter(Boolean).join(", ")}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            {event.startDate && (
              <p className="text-slate-300 text-[11px] sm:text-[12px] flex items-center gap-1">
                <Calendar className="w-3 h-3 shrink-0" />
                {formatEventDate(event.startDate)}
              </p>
            )}
            {price && (
              <p className="text-[#93C453] font-black text-xs sm:text-sm">
                {price}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── EventCard (grid/large variant) ─────────────────────────────────── */
function EventCardGrid({ event }: { event: any }) {
  const href = `/events/${event.slug || event.id}`;
  const price = formatPrice(event);

  return (
    <Link href={href} className="group block relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm active:scale-[0.98] transition-all duration-300 hover:shadow-xl">
      {/* Full Image */}
      {event.bannerUrl ? (
        <Image
          src={event.bannerUrl}
          alt={event.title}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center">
          <span className="text-white font-black text-3xl">
            {event.title.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {/* Category Badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
        {event.category && (
          <Badge className="bg-[#93C453] text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border-none shadow-md">
            {event.category}
          </Badge>
        )}
        {event.canPurchase === false && (
          <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-none shadow-md bg-red-600/90 text-white">
            Đã kết thúc
          </Badge>
        )}
      </div>

      {/* Hover Info Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4 z-10">
        <div className="translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-extrabold text-sm sm:text-base leading-snug line-clamp-2 drop-shadow-md">
            {event.title}
          </h3>
          {(event.venue || event.city) && (
            <p className="text-slate-300 text-[11px] sm:text-[12px] flex items-center gap-1 mt-1.5 line-clamp-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {[event.venue, event.city].filter(Boolean).join(", ")}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            {event.startDate && (
              <p className="text-slate-300 text-[11px] sm:text-[12px] flex items-center gap-1">
                <Calendar className="w-3 h-3 shrink-0" />
                {formatEventDate(event.startDate)}
              </p>
            )}
            {price && (
              <p className="text-[#93C453] font-black text-xs sm:text-sm">{price}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────── */
function SectionHeader({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <h2 className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-[12px] font-bold text-[#4A7C59] dark:text-[#93C453] shrink-0"
      >
        Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/* ─── Horizontal Scroll Row ──────────────────────────────────────────── */
function HScrollRow({ events, loading, viewAllHref = "/events" }: { events: any[]; loading: boolean; viewAllHref?: string }) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="flex gap-4 px-4 overflow-hidden py-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="shrink-0 w-[230px] sm:w-[250px] md:w-[280px]">
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!events.length) return null;

  return (
    <div
      ref={rowRef}
      className="flex gap-4 sm:gap-5 px-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 pt-2"
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {events.map((event: any) => (
        <div key={event.id} className="snap-start flex-shrink-0">
          <EventCardHScroll event={event} />
        </div>
      ))}

      {/* "Xem tất cả" card at end */}
      <Link
        href={viewAllHref}
        className="shrink-0 snap-start w-[230px] sm:w-[250px] md:w-[280px] aspect-[16/9] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-[#93C453] hover:text-[#4A7C59] dark:hover:text-[#93C453] transition-colors gap-2 text-center p-4 group hover:bg-slate-50 dark:hover:bg-slate-900/50"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
          <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <span className="text-sm sm:text-base font-bold leading-tight">Xem tất cả sự kiện</span>
      </Link>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function BuyerDashboardPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: homepageData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["homepage-events"],
    queryFn: async () => {
      try {
        const res = await api.get("/events/homepage");
        if (res.data?.success && res.data?.data?.allEvents?.length > 0) {
          return res.data.data;
        }
      } catch (e) {
        console.warn("Homepage endpoint fallback triggered:", e);
      }
      const [featRes, allRes] = await Promise.all([
        api.get("/events/featured").catch(() => ({ data: { data: [] } })),
        api.get("/events?limit=12").catch(() => ({ data: { data: [] } })),
      ]);
      const featData = featRes.data?.data;
      const allData = allRes.data?.data;
      return {
        featured: Array.isArray(featData) ? featData : featData?.events || [],
        allEvents: Array.isArray(allData) ? allData : allData?.events || [],
      };
    },
    staleTime: 3 * 60 * 1000,
  });

  const featuredEvents: any[] = homepageData?.featured || [];
  const allEvents: any[] = homepageData?.allEvents || [];

  // Fallback banner list
  const bannerList =
    featuredEvents.length > 0
      ? featuredEvents
      : allEvents.length > 0
      ? allEvents.slice(0, 3)
      : HERO_BANNERS;

  // Auto-advance banner
  useEffect(() => {
    const timer = setInterval(
      () => setCurrentSlide((p) => (p + 1) % bannerList.length),
      5000
    );
    return () => clearInterval(timer);
  }, [bannerList.length]);

  const prevSlide = () =>
    setCurrentSlide((p) => (p === 0 ? bannerList.length - 1 : p - 1));
  const nextSlide = () =>
    setCurrentSlide((p) => (p + 1) % bannerList.length);

  // Split events into sections (first 6 for horizontal, rest for grid)
  const hScrollEvents = allEvents.slice(0, 8);
  const trendingEvents = allEvents.slice(0, 6);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthEvents = allEvents.filter((event: any) => {
    if (!event.startDate) return false;
    const d = new Date(event.startDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* ══════════════════════════════════════════
          1. HERO BANNER CAROUSEL
          ══════════════════════════════════════════ */}
      <section className="pt-3 pb-4 px-4 bg-gradient-to-b from-[#EBF4FA] to-[#FAF7F2] dark:from-slate-900 dark:to-slate-950">
        <div className="relative max-w-[1280px] mx-auto">

          {/* Banner container */}
          <div
            onClick={() => {
              const b = bannerList[currentSlide];
              router.push(`/events/${b?.slug || b?.id || ""}`);
            }}
            className="relative w-full h-[180px] sm:h-[220px] md:h-[320px] lg:h-[400px] rounded-2xl md:rounded-3xl overflow-hidden shadow-lg cursor-pointer group"
          >
            {(() => {
              const b = bannerList[currentSlide % bannerList.length];
              const img = b?.bannerUrl || HERO_BANNERS[currentSlide % HERO_BANNERS.length].bannerUrl;
              const title = b?.title || HERO_BANNERS[0].title;
              const sub = b?.venue ? `${b.venue}${b.city ? ", " + b.city : ""}` : (b?.subtitle || HERO_BANNERS[0].subtitle);
              return (
                <>
                  <Image src={img} alt={title} fill priority className="object-cover transition-all duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Content */}
                  <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 z-10">
                    <Badge className="mb-2 bg-[#EB5B95] text-white text-[10px] md:text-sm font-extrabold px-3 py-1 border-none rounded-full">
                      NỔI BẬT
                    </Badge>
                    <h3 className="text-white font-black text-base sm:text-lg md:text-4xl leading-tight line-clamp-2 drop-shadow-md">
                      {title}
                    </h3>
                    {sub && (
                      <p className="text-slate-200 text-[12px] md:text-base mt-1 truncate drop-shadow-sm font-medium">
                        {sub}
                      </p>
                    )}
                  </div>
                  {/* Desktop arrows */}
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 hover:bg-[#93C453] items-center justify-center shadow-xl transition-all hover:scale-105"
                  >
                    <ChevronLeft className="h-6 w-6 text-slate-800" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 hover:bg-[#93C453] items-center justify-center shadow-xl transition-all hover:scale-105"
                  >
                    <ChevronRight className="h-6 w-6 text-slate-800" />
                  </button>
                </>
              );
            })()}
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {bannerList.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? "w-8 h-2 bg-[#93C453]"
                    : "w-2 h-2 bg-slate-300 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. ĐANG BÁN VÉ – Horizontal Scroll
          ══════════════════════════════════════════ */}
      <section className="py-6 md:py-10 bg-[#FAF7F2] dark:bg-slate-950">
        <div className="max-w-[1280px] mx-auto">
          <SectionHeader
            icon={<Flame className="h-5 w-5 text-[#EB5B95] fill-[#EB5B95]" />}
            title="Sự kiện đang bán vé"
            href="/events"
          />
          <HScrollRow events={hScrollEvents} loading={isLoadingEvents} />


          {/* Empty state */}
          {!isLoadingEvents && allEvents.length === 0 && (
            <div className="mx-4 text-center py-16 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
              <Ticket className="h-12 w-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-base">Chưa có sự kiện nào</p>
              <Button className="mt-4 rounded-full bg-[#93C453] text-slate-900 hover:bg-[#82B342] font-bold h-10 px-6" asChild>
                <Link href="/seller/events/create">Tạo sự kiện ngay</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2.5. SỰ KIỆN THÁNG NÀY
          ══════════════════════════════════════════ */}
      {!isLoadingEvents && thisMonthEvents.length > 0 && (
        <section className="py-6 md:py-10 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-[1280px] mx-auto">
            <SectionHeader
              icon={<Calendar className="h-5 w-5 text-[#93C453]" />}
              title={`Sự kiện tháng ${currentMonth + 1}`}
              href="/events?time=this-month"
            />
            <HScrollRow events={thisMonthEvents} loading={isLoadingEvents} viewAllHref="/events?time=this-month" />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          3. XU HƯỚNG – Grid 2 cột trên mobile
          ══════════════════════════════════════════ */}
      {!isLoadingEvents && trendingEvents.length > 0 && (
        <section className="py-6 md:py-10 bg-[#FAF7F2] dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-[1280px] mx-auto">
            <SectionHeader
              icon={<TrendingUp className="h-5 w-5 text-[#4A7C59] dark:text-[#93C453]" />}
              title="Xu hướng"
              href="/events?sort=trending"
            />

            {/* Mobile: 2-column grid */}
            <div className="grid grid-cols-2 md:hidden gap-4 px-4">
              {trendingEvents.slice(0, 4).map((event: any) => (
                <EventCardGrid key={event.id} event={event} />
              ))}
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5 px-4">
              {trendingEvents.map((event: any) => (
                <EventCardGrid key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          4. TÍNH NĂNG NỔI BẬT
          ══════════════════════════════════════════ */}
      <section className="py-8 md:py-12 px-4 bg-[#EBF4FA] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto">
          {/* Mobile: horizontal scroll chips */}
          <div className="flex gap-4 overflow-x-auto pb-2 md:hidden" style={{ scrollbarWidth: "none" }}>
            {[
              { icon: <Zap className="w-5 h-5" />, title: "Giữ chỗ 15 phút", color: "bg-[#93C453]/20 text-[#4A7C59]" },
              { icon: <ShieldCheck className="w-5 h-5" />, title: "Thanh toán VietQR", color: "bg-[#A8C7DC]/30 text-[#2C4A60] dark:text-[#A8C7DC]" },
              { icon: <QrCode className="w-5 h-5" />, title: "E-Ticket & Check-in QR", color: "bg-[#EB5B95]/20 text-[#EB5B95]" },
            ].map((feat) => (
              <div key={feat.title} className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${feat.color}`}>
                  {feat.icon}
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{feat.title}</p>
              </div>
            ))}
          </div>

          {/* Desktop: 3-column cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                iconCls: "bg-[#93C453]/20 text-[#4A7C59] dark:text-[#93C453]",
                title: "Giữ chỗ 15 phút",
                desc: "Tự động giữ vị trí ghế và vé trong 15 phút giúp bạn thoải mái quét mã thanh toán VietQR.",
              },
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                iconCls: "bg-[#A8C7DC]/30 text-[#2C4A60] dark:text-[#A8C7DC]",
                title: "Thanh toán PayOS VietQR",
                desc: "Thanh toán chuyển khoản ngân hàng bằng mã QR tự động xác thực trong vài giây.",
              },
              {
                icon: <QrCode className="h-6 w-6" />,
                iconCls: "bg-[#EB5B95]/20 text-[#EB5B95]",
                title: "E-Ticket & Check-in QR Code",
                desc: "Vé điện tử gửi trực tiếp qua Email với mã QR mã hóa an toàn chống vé giả.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${f.iconCls}`}>
                  {f.icon}
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
