"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Star, Search, ShieldAlert, Trash2, Eye, ShieldCheck, MessageSquare, RefreshCw, RotateCcw, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Fetch 100% Real Reviews from Backend API
  const { data: reviewsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-reviews", search, ratingFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ratingFilter !== "ALL") params.set("rating", ratingFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await api.get(`/admin/reviews?${params.toString()}`);
      return res.data.success ? res.data.data : [];
    },
  });

  const reviews = Array.isArray(reviewsData) ? reviewsData : [];

  // Toggle Hide Mutation
  const toggleHideMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/admin/reviews/${id}/toggle-hide`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật trạng thái ẩn/hiển thị đánh giá thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi cập nhật đánh giá");
    },
  });

  // Delete Review Mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/reviews/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã xóa vĩnh viễn đánh giá thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Lỗi xóa đánh giá");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này không?")) {
      deleteReviewMutation.mutate(id);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setRatingFilter("ALL");
    setStatusFilter("ALL");
    toast.success("Đã đặt lại tất cả bộ lọc");
  };

  // Metric Aggregates
  const totalCount = reviews.length;
  const avgRating = (reviews.reduce((s: number, r: any) => s + Number(r.rating || 0), 0) / (reviews.length || 1)).toFixed(1);
  const negativeCount = reviews.filter((r: any) => Number(r.rating) <= 2).length;
  const hiddenCount = reviews.filter((r: any) => r.isHidden).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <MessageSquare className="h-7 w-7 text-primary" /> Đánh Giá & Phản Hồi (Reviews & Feedback)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý, kiểm duyệt và ẩn/hiển thị các đánh giá thực tế của người dùng về sự kiện.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold gap-2 border-border/60 self-start sm:self-auto"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới
        </Button>
      </div>

      {/* 4 Interactive Clickable Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total Reviews */}
        <Card
          onClick={() => { setRatingFilter("ALL"); setStatusFilter("ALL"); }}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            ratingFilter === "ALL" && statusFilter === "ALL"
              ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md scale-[1.02]"
              : "border-border/50 bg-card hover:border-primary/50 hover:bg-muted/20"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Tổng Đánh Giá</p>
            <p className="text-2xl font-black text-foreground mt-1">{totalCount}</p>
          </CardContent>
        </Card>

        {/* Card 2: Average Rating */}
        <Card
          onClick={() => { setRatingFilter("ALL"); setStatusFilter("ALL"); }}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border border-amber-500/20 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Đánh Giá Trung Bình</p>
            <p className="text-2xl font-black text-amber-500 mt-1">{avgRating} / 5.0</p>
          </CardContent>
        </Card>

        {/* Card 3: Negative Reviews (1-2 Stars) */}
        <Card
          onClick={() => { setRatingFilter("NEGATIVE"); setStatusFilter("ALL"); }}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            ratingFilter === "NEGATIVE"
              ? "border-red-500 bg-red-500/15 ring-2 ring-red-500/30 shadow-md scale-[1.02]"
              : "border-red-500/20 bg-red-500/5 hover:border-red-500 hover:bg-red-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider">Đánh Giá Tiêu Cực (1-2★)</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{negativeCount}</p>
          </CardContent>
        </Card>

        {/* Card 4: Hidden Reviews */}
        <Card
          onClick={() => { setStatusFilter("HIDDEN"); setRatingFilter("ALL"); }}
          className={`rounded-2xl cursor-pointer transition-all duration-200 shadow-xs border ${
            statusFilter === "HIDDEN"
              ? "border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/30 shadow-md scale-[1.02]"
              : "border-purple-500/20 bg-purple-500/5 hover:border-purple-500 hover:bg-purple-500/10"
          }`}
        >
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Đã Ẩn (Vi Phạm)</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{hiddenCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Filter Toolbar */}
      <Card className="rounded-2xl border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm nội dung, tên người dùng, sự kiện..."
                className="pl-9 h-10 rounded-xl text-xs font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Số sao" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="text-xs font-bold">Tất cả sao</SelectItem>
                <SelectItem value="5" className="text-xs">5 Sao ⭐⭐⭐⭐⭐</SelectItem>
                <SelectItem value="4" className="text-xs">4 Sao ⭐⭐⭐⭐</SelectItem>
                <SelectItem value="3" className="text-xs">3 Sao ⭐⭐⭐</SelectItem>
                <SelectItem value="2" className="text-xs">2 Sao ⭐⭐</SelectItem>
                <SelectItem value="1" className="text-xs">1 Sao ⭐</SelectItem>
                <SelectItem value="NEGATIVE" className="text-xs text-red-500 font-bold">Tiêu cực (1-2★)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Trạng thái hiển thị" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ALL" className="text-xs font-bold">Tất cả trạng thái</SelectItem>
                <SelectItem value="VISIBLE" className="text-xs">Đang hiển thị công khai</SelectItem>
                <SelectItem value="HIDDEN" className="text-xs">Đã ẩn khỏi người dùng</SelectItem>
              </SelectContent>
            </Select>

            {(search || ratingFilter !== "ALL" || statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-xl gap-1.5 font-semibold text-xs text-muted-foreground hover:text-foreground"
                onClick={handleResetFilters}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Đặt lại
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-muted-foreground font-medium">
              Hiển thị <strong className="text-foreground">{reviews.length}</strong> đánh giá sau khi lọc
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card className="rounded-3xl border-border/50 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-base font-bold text-foreground">Không tìm thấy đánh giá nào</p>
              <p className="text-xs mt-1">Chưa có phản hồi thực tế từ người dùng hoặc không khớp bộ lọc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold text-xs uppercase tracking-wider w-[22%]">Người Dùng / Sự Kiện</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider w-[12%]">Đánh Giá</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider w-[48%]">Nội Dung Đánh Giá</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right w-[18%]">Hành Động Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r: any) => (
                    <TableRow key={r.id} className={`hover:bg-muted/20 transition-colors ${r.isHidden ? "opacity-60 bg-muted/10" : ""}`}>
                      <TableCell>
                        <p className="font-bold text-sm text-foreground line-clamp-1">{r.user?.name || r.user?.email || "Khách hàng"}</p>
                        <p className="text-xs text-primary font-medium line-clamp-1 mt-0.5">{r.event?.title || "Sự kiện"}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center text-amber-500 font-bold text-sm">
                          <span className="mr-1">{r.rating}</span>
                          <Star className="h-4 w-4 fill-current text-amber-500" />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-xs text-foreground leading-relaxed line-clamp-3">{r.content}</p>
                        </div>
                        {r.isHidden && (
                          <Badge variant="secondary" className="mt-1.5 text-[9px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            🔒 Đã ẩn khỏi hiển thị công khai
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-8 rounded-xl text-xs font-bold gap-1 ${
                              r.isHidden
                                ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10"
                                : "border-amber-500/30 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10"
                            }`}
                            onClick={() => toggleHideMutation.mutate(r.id)}
                            disabled={toggleHideMutation.isPending}
                          >
                            {r.isHidden ? (
                              <><Eye className="h-3.5 w-3.5" /> Mở lại</>
                            ) : (
                              <><ShieldAlert className="h-3.5 w-3.5" /> Ẩn đi</>
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(r.id)}
                            disabled={deleteReviewMutation.isPending}
                            title="Xóa đánh giá"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
