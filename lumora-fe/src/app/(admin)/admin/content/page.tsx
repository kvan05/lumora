"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Megaphone, Plus, Search, Edit2, Trash2, ExternalLink, RefreshCw, Star, Image, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "FEATURED" | "PUBLISHED" | "DRAFT">("ALL");

  // Fetch 100% Real Events & System Content from Backend API
  const { data: eventsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-content-events"],
    queryFn: async () => {
      const res = await api.get("/admin/events");
      return res.data.success ? res.data.data : [];
    },
  });

  const events = Array.isArray(eventsData) ? eventsData : [];

  // Filtered Events
  const filtered = events.filter((e: any) => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.slug?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === "ALL"
        ? true
        : activeFilter === "FEATURED"
        ? e.isFeatured
        : activeFilter === "PUBLISHED"
        ? e.status === "PUBLISHED"
        : e.status === "DRAFT" || e.status === "PAUSED";
    return matchSearch && matchFilter;
  });

  // Metrics
  const totalCount = events.length;
  const featuredCount = events.filter((e: any) => e.isFeatured).length;
  const publishedCount = events.filter((e: any) => e.status === "PUBLISHED").length;
  const draftCount = events.filter((e: any) => e.status === "DRAFT" || e.status === "PAUSED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Megaphone className="h-7 w-7 text-primary" /> Quản Lý Nội Dung & Banner Quảng Cáo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kiểm soát hiển thị banner trang chủ, sự kiện nổi bật (Featured) và trang thông tin toàn hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-bold gap-2 border-border/60"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới
          </Button>
          <Link href="/admin/events">
            <Button className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4" /> Quản Lý Sự Kiện Banner
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Interactive Clickable Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <Card
          onClick={() => setActiveFilter("ALL")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "ALL"
              ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md scale-[1.02]"
              : "border-border/50 bg-card hover:border-primary/50 hover:bg-muted/20"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Tổng Nội Dung Sàn</p>
            <p className="text-2xl font-black text-foreground mt-1">{totalCount}</p>
          </CardContent>
        </Card>

        {/* Card 2: Featured Banner */}
        <Card
          onClick={() => setActiveFilter("FEATURED")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "FEATURED"
              ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-md scale-[1.02]"
              : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Banner Nổi Bật</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{featuredCount}</p>
          </CardContent>
        </Card>

        {/* Card 3: Published */}
        <Card
          onClick={() => setActiveFilter("PUBLISHED")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "PUBLISHED"
              ? "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]"
              : "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Nội Dung Đã Xuất Bản</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{publishedCount}</p>
          </CardContent>
        </Card>

        {/* Card 4: Draft / Paused */}
        <Card
          onClick={() => setActiveFilter("DRAFT")}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            activeFilter === "DRAFT"
              ? "border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/30 shadow-md scale-[1.02]"
              : "border-purple-500/20 bg-purple-500/5 hover:border-purple-500 hover:bg-purple-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Bản Nháp / Ẩn Banner</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{draftCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề sự kiện, banner..."
              className="pl-9 h-10 rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Hiển thị <strong className="text-foreground">{filtered.length}</strong> mục nội dung
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không tìm thấy nội dung nào khớp bộ lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Tiêu Đề Banner / Sự Kiện</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Loại Hiển Thị</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng Thái</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Thời Gian Khởi Tạo</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Xem Chi Tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e: any) => (
                    <TableRow key={e.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/40 flex items-center justify-center">
                            {e.bannerUrl ? (
                              <img src={e.bannerUrl} alt={e.title} className="w-full h-full object-cover" />
                            ) : (
                              <Image className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground line-clamp-1">{e.title}</p>
                            <p className="text-xs text-muted-foreground font-mono">/events/{e.slug}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {e.isFeatured ? (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-[10px]">
                              ⭐ Featured Banner
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-bold">
                              Standard Listing
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            e.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                          }`}
                        >
                          {e.status === "PUBLISHED" ? "Đã xuất bản" : e.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/events/${e.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs font-bold gap-1 text-primary">
                            <ExternalLink className="h-3.5 w-3.5" /> Xem
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
