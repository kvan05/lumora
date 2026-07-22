"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["Âm nhạc", "Thể thao", "Sân khấu", "Nghệ thuật", "Ẩm thực", "Hội thảo"];
const CITIES = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng"];

export default function EventsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["events", search, category, city],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (city) params.append("city", city);
      const res = await api.get(`/events?${params.toString()}`);
      return res.data.data.events;
    },
  });

  const handleClear = () => {
    setSearch("");
    setCategory("");
    setCity("");
  };

  const hasFilters = !!(search || category || city);

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Page header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Sự kiện</h1>
        <p className="text-lg text-muted-foreground">
          Khám phá và đặt vé cho những trải nghiệm tuyệt vời nhất xung quanh bạn.
        </p>
      </div>

      {/* Search & filter bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên sự kiện, địa điểm..."
              className="pl-11 h-11 rounded-xl bg-card border-border/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            className="rounded-xl h-11 gap-2 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
            {hasFilters && (
              <Badge className="ml-1 h-5 w-5 p-0 justify-center text-xs rounded-full">
                {[category, city].filter(Boolean).length}
              </Badge>
            )}
          </Button>
          {hasFilters && (
            <Button variant="ghost" className="rounded-xl h-11 text-muted-foreground" onClick={handleClear}>
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Expandable filter panel */}
        {showFilters && (
          <div className="p-4 rounded-xl border border-border/60 bg-card/50 space-y-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Danh mục</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={category === "" ? "default" : "outline"}
                  className="rounded-full text-xs h-7"
                  onClick={() => setCategory("")}
                >
                  Tất cả
                </Button>
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={category === cat ? "default" : "outline"}
                    className="rounded-full text-xs h-7"
                    onClick={() => setCategory(category === cat ? "" : cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Thành phố</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={city === "" ? "default" : "outline"}
                  className="rounded-full text-xs h-7"
                  onClick={() => setCity("")}
                >
                  Tất cả
                </Button>
                {CITIES.map((c) => (
                  <Button
                    key={c}
                    size="sm"
                    variant={city === c ? "default" : "outline"}
                    className="rounded-full text-xs h-7"
                    onClick={() => setCity(city === c ? "" : c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-52 w-full rounded-2xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-border/60 rounded-2xl bg-card/20">
          <div className="text-5xl mb-4">🎭</div>
          <h3 className="text-xl font-bold mb-2">Không tìm thấy sự kiện nào</h3>
          <p className="text-muted-foreground mb-6">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          <Button variant="outline" className="rounded-full" onClick={handleClear}>
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <>
          {data && (
            <p className="text-sm text-muted-foreground mb-5">
              Tìm thấy <span className="font-bold text-foreground">{data.length}</span> sự kiện
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.map((event: any) => {
              const eventDate = new Date(event.startDate);
              return (
                <Link key={event.id} href={`/events/${event.slug || event.id}`} className="group">
                  <Card className="h-full overflow-hidden hover:shadow-lg transition-all rounded-2xl border border-border/50 hover:border-primary/40 bg-card/60 hover:bg-card">
                    <div className="relative h-52 w-full bg-muted overflow-hidden">
                      {event.bannerUrl ? (
                        <Image
                          src={event.bannerUrl}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                          <span className="text-primary font-extrabold text-4xl opacity-30">
                            {event.title.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-background/85 text-foreground backdrop-blur-sm border-none rounded-full shadow-sm text-xs py-0.5 px-2.5">
                          {event.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-extrabold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                        {event.title}
                      </h3>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{format(eventDate, "EEEE, d MMM, yyyy", { locale: vi })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{event.venue}, {event.city}</span>
                        </div>
                      </div>
                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-border/40">
                        <div>
                          <span className="text-[9px] text-muted-foreground block uppercase tracking-wider">Từ</span>
                          <span className="font-extrabold text-primary text-sm">
                            {event.minPrice
                              ? `${Number(event.minPrice).toLocaleString("vi-VN")} ₫`
                              : "Liên hệ"}
                          </span>
                        </div>
                        <div className="text-primary group-hover:translate-x-0.5 transition-transform">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
