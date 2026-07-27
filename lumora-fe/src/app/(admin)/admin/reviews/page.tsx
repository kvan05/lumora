"use client";

import { useState } from "react";
import { Star, Search, ShieldAlert, Trash2, Eye, ShieldCheck, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const MOCK_REVIEWS = [
  { id: "rv1", user: "Nguyễn Văn An", event: "Live Concert Sky Dec", rating: 5, content: "Sự kiện rất tuyệt vời, âm thanh ánh sáng đỉnh cao!", isHidden: false, date: "2026-07-20" },
  { id: "rv2", user: "Trần Thị Bích", event: "Workshop Kỹ năng", rating: 4, content: "Nội dung hay nhưng không gian hơi chật.", isHidden: false, date: "2026-07-18" },
  { id: "rv3", user: "Lê Văn Cường", event: "Marathon TP.HCM", rating: 1, content: "Lừa đảo, tổ chức lộn xộn, không có nước uống!", isHidden: true, date: "2026-07-15" },
  { id: "rv4", user: "Phạm Dung", event: "Food Festival", rating: 5, content: "Đồ ăn ngon, giá hợp lý. Sẽ tham gia lại.", isHidden: false, date: "2026-07-12" },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  const filtered = reviews.filter(r => {
    const matchSearch = !search || r.event.toLowerCase().includes(search.toLowerCase()) || r.user.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase());
    const matchRating = ratingFilter === "ALL" || r.rating.toString() === ratingFilter;
    return matchSearch && matchRating;
  });

  const handleToggleHidden = (id: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== id) return r;
      toast.success(r.isHidden ? "Đã hiển thị đánh giá" : "Đã ẩn đánh giá");
      return { ...r, isHidden: !r.isHidden };
    }));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này?")) return;
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success("Đã xóa đánh giá.");
  };

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length || 0).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Đánh giá & Phản hồi ⭐</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý và kiểm duyệt các đánh giá của người dùng về sự kiện.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng đánh giá", value: reviews.length, color: "text-foreground" },
          { label: "Đánh giá trung bình", value: `${avgRating} / 5.0`, color: "text-yellow-500" },
          { label: "Đánh giá tiêu cực (1-2★)", value: reviews.filter(r => r.rating <= 2).length, color: "text-red-500" },
          { label: "Đã ẩn", value: reviews.filter(r => r.isHidden).length, color: "text-purple-500" },
        ].map(s => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm nội dung, người dùng, sự kiện..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-32 h-9 rounded-xl">
              <SelectValue placeholder="Số sao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả sao</SelectItem>
              <SelectItem value="5">5 Sao</SelectItem>
              <SelectItem value="4">4 Sao</SelectItem>
              <SelectItem value="3">3 Sao</SelectItem>
              <SelectItem value="2">2 Sao</SelectItem>
              <SelectItem value="1">1 Sao</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider w-[20%]">Người dùng / Sự kiện</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider w-[10%]">Đánh giá</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider w-[50%]">Nội dung</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right w-[20%]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r.id} className={`hover:bg-muted/20 ${r.isHidden ? "opacity-60 bg-muted/10" : ""}`}>
                <TableCell>
                  <p className="font-bold text-sm">{r.user}</p>
                  <p className="text-xs text-muted-foreground">{r.event}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.date}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-yellow-500">
                    <span className="font-bold mr-1">{r.rating}</span>
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm line-clamp-2">{r.content}</p>
                  </div>
                  {r.isHidden && <Badge variant="secondary" className="mt-1 text-[10px]">Đã ẩn khỏi người dùng</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-1.5" onClick={() => handleToggleHidden(r.id)}>
                      {r.isHidden ? <><Eye className="h-3.5 w-3.5 text-emerald-500" /> Hiển thị</> : <><ShieldAlert className="h-3.5 w-3.5 text-orange-500" /> Ẩn đi</>}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
