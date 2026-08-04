"use client";

import { useState } from "react";
import { ShieldCheck, Search, CheckCircle, XCircle, Eye, Building2, FileText, Ban, CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const MOCK_ORGANIZERS = [
  { id: "o1", name: "Công ty Âm nhạc Phương Nam", email: "contact@phuongnam.vn", phone: "0908123456", businessLicense: "0312345678", status: "VERIFIED", eventsCount: 12, revenue: 230000000, isBlocked: false, documentUrl: "https://example.com/license1.pdf" },
  { id: "o2", name: "VietTech Corp", email: "info@viettech.vn", phone: "0912345678", businessLicense: "0109876543", status: "VERIFIED", eventsCount: 3, revenue: 80000000, isBlocked: false, documentUrl: "https://example.com/license2.pdf" },
  { id: "o3", name: "Hội Ẩm thực Đà Nẵng", email: "amthucdn@gmail.com", phone: "0935111222", businessLicense: "3201234567", status: "PENDING", eventsCount: 1, revenue: 15000000, isBlocked: false, documentUrl: "https://example.com/license3.pdf" },
  { id: "o4", name: "Sports Việt", email: "admin@sportsviet.vn", phone: "0988777666", businessLicense: "0305554443", status: "VERIFIED", eventsCount: 5, revenue: 60000000, isBlocked: false, documentUrl: "https://example.com/license4.pdf" },
  { id: "o5", name: "Art & Culture Club", email: "artclub@gmail.com", phone: "0977112233", businessLicense: "Chưa nộp", status: "PENDING", eventsCount: 0, revenue: 0, isBlocked: false, documentUrl: null },
];

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState(MOCK_ORGANIZERS);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = organizers.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.email.toLowerCase().includes(search.toLowerCase()) || o.businessLicense.includes(search)
  );

  const handleVerify = (id: string, approve: boolean) => {
    setOrganizers(prev => prev.map(o => o.id === id ? { ...o, status: approve ? "VERIFIED" : "REJECTED" } : o));
    toast.success(approve ? "Đã duyệt nhà tổ chức thành công!" : "Đã từ chối nhà tổ chức.");
    if (detailOpen) setDetailOpen(false);
  };

  const handleToggleBlock = (id: string) => {
    setOrganizers(prev => prev.map(o => {
      if (o.id !== id) return o;
      toast.success(o.isBlocked ? "Đã mở khóa nhà tổ chức" : "Đã khóa nhà tổ chức");
      return { ...o, isBlocked: !o.isBlocked };
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Quản lý nhà tổ chức (Organizer) 🏢</h1>
        <p className="text-sm text-muted-foreground mt-1">Duyệt hồ sơ doanh nghiệp, kiểm tra giấy tờ và theo dõi doanh thu.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng nhà tổ chức", value: organizers.length, color: "text-foreground" },
          { label: "Đã xác minh", value: organizers.filter(o => o.status === "VERIFIED").length, color: "text-emerald-500" },
          { label: "Chờ duyệt hồ sơ", value: organizers.filter(o => o.status === "PENDING").length, color: "text-yellow-500" },
          { label: "Tổng doanh thu NTC", value: `${(organizers.reduce((s, o) => s + o.revenue, 0) / 1000000).toFixed(0)}M ₫`, color: "text-blue-500" },
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
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo tên tổ chức, email, GPKD..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-bold text-xs uppercase tracking-wider">Tên tổ chức</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Mã ĐKKD</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Sự kiện đã tạo</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider hidden lg:table-cell">Doanh thu</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(org => (
                <TableRow key={org.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600 font-bold text-sm">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.email} · {org.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-sm font-mono">{org.businessLicense}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm font-semibold">{org.eventsCount} sự kiện</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm font-bold text-emerald-600">{(org.revenue || 0).toLocaleString("vi-VN")}₫</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${org.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : org.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                        {org.status === "VERIFIED" ? "Đã duyệt" : org.status === "PENDING" ? "Chờ duyệt" : "Từ chối"}
                      </span>
                      {org.isBlocked && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 w-fit">🔒 Bị khóa</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setSelectedOrg(org); setDetailOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {org.status === "PENDING" && (
                        <>
                          <Button size="sm" className="h-7 text-xs px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleVerify(org.id, true)}>
                            Duyệt
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${org.isBlocked ? "text-emerald-500" : "text-red-500"}`} onClick={() => handleToggleBlock(org.id)}>
                        {org.isBlocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold">Thông tin nhà tổ chức</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Tên tổ chức", value: selectedOrg.name },
                  { label: "Email liên hệ", value: selectedOrg.email },
                  { label: "Số điện thoại", value: selectedOrg.phone },
                  { label: "Mã ĐKKD/MST", value: selectedOrg.businessLicense },
                  { label: "Số sự kiện đã tạo", value: `${selectedOrg.eventsCount} sự kiện` },
                  { label: "Doanh thu tích lũy", value: `${(selectedOrg.revenue || 0).toLocaleString("vi-VN")} ₫` },
                ].map(item => (
                  <div key={item.label} className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                    <p className="font-semibold mt-0.5 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              {selectedOrg.documentUrl && (
                <div className="bg-primary/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs font-bold">Giấy phép đăng ký kinh doanh</p>
                      <p className="text-[10px] text-muted-foreground">Tài liệu đã được tải lên</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs" onClick={() => window.open(selectedOrg.documentUrl, "_blank")}>
                    Xem file
                  </Button>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setDetailOpen(false)}>Đóng</Button>
                {selectedOrg.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl text-destructive border-destructive/30" onClick={() => handleVerify(selectedOrg.id, false)}>
                      Từ chối
                    </Button>
                    <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleVerify(selectedOrg.id, true)}>
                      Xác minh & Duyệt
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
