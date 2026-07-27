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
import { Calendar, MapPin, Search, SlidersHorizontal, ChevronRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Âm nhạc", "Thể thao", "Sân khấu", "Nghệ thuật", "Ẩm thực", "Hội thảo"];
const CITIES = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng"];

export default function EventsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["events", search, category, city, priceRange, dateFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (city) params.append("city", city);
      if (priceRange) params.append("price", priceRange);
      if (dateFilter) params.append("date", dateFilter);
      if (sortBy) params.append("sort", sortBy);
      
      const res = await api.get(`/events?${params.toString()}`);
      return res.data.data.events;
    },
  });

  const handleClear = () => {
    setSearch("");
    setCategory("");
    setCity("");
    setPriceRange("");
    setDateFilter("");
    setSortBy("latest");
  };

  const hasFilters = !!(search || category || city || priceRange || dateFilter || sortBy !== "latest");

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
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl bg-card border-border/60">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Mới nhất</SelectItem>
              <SelectItem value="upcoming">Gần ngày diễn ra</SelectItem>
              <SelectItem value="price_asc">Giá tăng dần</SelectItem>
              <SelectItem value="price_desc">Giá giảm dần</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showFilters ? "default" : "outline"}
            className="rounded-xl h-11 gap-2 shrink-0 bg-card border-border/60 hover:bg-muted"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
            {hasFilters && (
              <Badge className="ml-1 h-5 w-5 p-0 justify-center text-xs rounded-full bg-primary text-primary-foreground">
                {[category, city, priceRange, dateFilter].filter(Boolean).length}
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
          <div className="p-5 rounded-2xl border border-border/60 bg-card/50 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Danh mục</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={category === "" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setCategory("")}>
                    Tất cả
                  </Button>
                  {CATEGORIES.map((cat) => (
                    <Button key={cat} size="sm" variant={category === cat ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setCategory(category === cat ? "" : cat)}>
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Khu vực</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={city === "" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setCity("")}>
                    Tất cả
                  </Button>
                  {CITIES.map((c) => (
                    <Button key={c} size="sm" variant={city === c ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setCity(city === c ? "" : c)}>
                      {c}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Mức giá</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={priceRange === "" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setPriceRange("")}>
                    Tất cả
                  </Button>
                  <Button size="sm" variant={priceRange === "free" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setPriceRange("free")}>Miễn phí</Button>
                  <Button size="sm" variant={priceRange === "under_500" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setPriceRange("under_500")}>Dưới 500k</Button>
                  <Button size="sm" variant={priceRange === "500_1000" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setPriceRange("500_1000")}>500k - 1tr</Button>
                  <Button size="sm" variant={priceRange === "over_1000" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setPriceRange("over_1000")}>Trên 1tr</Button>
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Thời gian</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={dateFilter === "" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setDateFilter("")}>
                    Tất cả
                  </Button>
                  <Button size="sm" variant={dateFilter === "today" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setDateFilter("today")}>Hôm nay</Button>
                  <Button size="sm" variant={dateFilter === "this_week" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setDateFilter("this_week")}>Tuần này</Button>
                  <Button size="sm" variant={dateFilter === "this_month" ? "default" : "outline"} className="rounded-full text-xs h-8" onClick={() => setDateFilter("this_month")}>Tháng này</Button>
                </div>
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
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : data?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/50">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">Không tìm thấy sự kiện</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Không có sự kiện nào phù hợp với bộ lọc của bạn. Vui lòng thử tìm kiếm với các tiêu chí khác.
          </p>
          <Button variant="outline" className="mt-6 rounded-xl" onClick={handleClear}>
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.map((event: any) => (
            <Link key={event.id} href={`/events/${event.slug || event.id}`} className="group h-full flex">
              <Card className="rounded-2xl border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden flex flex-col w-full h-full">
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {event.bannerUrl ? (
                    <Image src={event.bannerUrl} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500">
                      <span className="text-primary/40 font-bold uppercase tracking-widest">{event.category}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-background/90 text-foreground backdrop-blur-sm hover:bg-background/90">
                      {event.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 z-10">
                    <FavoriteButton eventId={event.id} variant="outline" className="bg-background/80 backdrop-blur border border-border/60 shadow-sm h-8 w-8" />
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h3>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
                      <span>{format(new Date(event.startDate), "EEEE, dd/MM/yyyy", { locale: vi })}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-primary/70 mt-0.5" />
                      <span className="line-clamp-1">{event.venue}, {event.city}</span>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Từ</p>
                      <p className="font-black text-primary">
                          {event.minPrice ? `${Number(event.minPrice).toLocaleString("vi-VN")} ₫` : "Liên hệ"}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <ChevronRight className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
