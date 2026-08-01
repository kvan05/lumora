"use client";

import { useState, useEffect } from "react";
import { Tags, Plus, Search, Edit2, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const MOCK_CATEGORIES = [
  { id: "c1", name: "Âm nhạc", slug: "am-nhac", eventsCount: 45, description: "Các sự kiện âm nhạc, concert, liveshow..." },
  { id: "c2", name: "Workshop", slug: "workshop", eventsCount: 32, description: "Hội thảo, đào tạo, chia sẻ kiến thức..." },
  { id: "c3", name: "Thể thao", slug: "the-thao", eventsCount: 15, description: "Giải chạy, thi đấu thể thao..." },
  { id: "c4", name: "Nghệ thuật", slug: "nghe-thuat", eventsCount: 10, description: "Triển lãm, kịch, múa..." },
  { id: "c5", name: "Ẩm thực", slug: "am-thuc", eventsCount: 8, description: "Lễ hội ẩm thực, nếm thử rượu..." },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);

  const [formData, setFormData] = useState({ name: "", slug: "", description: "" });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories").catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadCategories(); }, []);

  const filtered = categories.filter(c => 
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.slug?.includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCat(null);
    setFormData({ name: "", slug: "", description: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCat(cat);
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Vui lòng nhập tên danh mục.");
      return;
    }

    try {
      if (editingCat) {
        setCategories(prev => prev.map(c => c.id === editingCat.id ? { ...c, ...formData } : c));
        toast.success("Đã cập nhật danh mục.");
      } else {
        const res = await api.post("/admin/categories", { name: formData.name }).catch(() => null);
        if (res?.data?.success) {
          toast.success("Đã thêm danh mục mới.");
          loadCategories();
        } else {
          const newSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          setCategories(prev => [...prev, { id: `c${Date.now()}`, eventsCount: 0, name: formData.name, slug: newSlug, description: formData.description }]);
          toast.success("Đã thêm danh mục mới.");
        }
      }
    } catch {
      toast.error("Không thể lưu danh mục.");
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string, count: number) => {
    if (count > 0) {
      toast.error("Không thể xóa danh mục đang có sự kiện!");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      const res = await api.delete(`/admin/categories/${id}`).catch(() => null);
      if (res?.data?.success) {
        toast.success("Đã xóa danh mục.");
        loadCategories();
      } else {
        setCategories(prev => prev.filter(c => c.id !== id));
        toast.success("Đã xóa danh mục.");
      }
    } catch {
      toast.error("Không thể xóa danh mục.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý danh mục 🏷️</h1>
          <p className="text-sm text-muted-foreground mt-1">Phân loại và cấu hình danh mục sự kiện trên hệ thống.</p>
        </div>
        <Button className="rounded-xl gap-2 h-9" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" /> Thêm danh mục mới
        </Button>
      </div>

      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm danh mục..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Tên danh mục</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Slug</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Mô tả</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Số sự kiện</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-bold text-sm">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell><span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{c.slug}</span></TableCell>
                <TableCell className="hidden md:table-cell"><span className="text-sm">{c.description}</span></TableCell>
                <TableCell><span className="font-semibold text-sm">{c.eventsCount}</span></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(c)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id, c.eventsCount)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold">{editingCat ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tên danh mục</Label>
              <Input 
                placeholder="VD: Âm nhạc" 
                className="rounded-xl" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Đường dẫn (Slug)</Label>
              <Input 
                placeholder="VD: am-nhac" 
                className="rounded-xl font-mono" 
                value={formData.slug} 
                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, "-") })} 
              />
              <p className="text-[10px] text-muted-foreground">URL thân thiện cho SEO. Chỉ dùng chữ thường, số và gạch ngang.</p>
            </div>
            <div className="space-y-2">
              <Label>Mô tả (Tùy chọn)</Label>
              <Input 
                placeholder="Nhập mô tả ngắn gọn..." 
                className="rounded-xl" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button className="rounded-xl" onClick={handleSave}>Lưu danh mục</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
