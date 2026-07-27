"use client";

import { useState } from "react";
import { QrCode, Search, CheckCircle2, XCircle, Clock, Ban, RotateCcw, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const MOCK_TICKETS = [
  { id: "LM20260001", event: "Live Concert Sky Dec", holder: "Nguyễn Văn An", type: "VIP", isCheckedIn: false, isLocked: false, checkedInAt: null, issuedAt: "2026-07-10" },
  { id: "LM20260002", event: "Live Concert Sky Dec", holder: "Trần Thị Bích", type: "Regular", isCheckedIn: true, isLocked: false, checkedInAt: "2026-08-15 19:30:00", issuedAt: "2026-07-12" },
  { id: "LM20260003", event: "Hà Anh Tuấn Concert", holder: "Lê Minh Cường", type: "Premium", isCheckedIn: false, isLocked: true, checkedInAt: null, issuedAt: "2026-07-14" },
  { id: "LM20260004", event: "Workshop Kỹ năng mềm", holder: "Phạm Thị Dung", type: "Standard", isCheckedIn: true, isLocked: false, checkedInAt: "2026-07-25 09:00:00", issuedAt: "2026-07-15" },
  { id: "LM20260005", event: "Marathon TP.HCM", holder: "Vũ Hoàng Gia", type: "Runner", isCheckedIn: false, isLocked: false, checkedInAt: null, issuedAt: "2026-07-16" },
];

export default function CheckinPage() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [search, setSearch] = useState("");
  const [searchId, setSearchId] = useState("");
  const [checkedTicket, setCheckedTicket] = useState<any>(null);

  const filtered = tickets.filter(t =>
    !search || t.id.toLowerCase().includes(search.toLowerCase()) || t.holder.toLowerCase().includes(search.toLowerCase()) || t.event.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearch = () => {
    const ticket = tickets.find(t => t.id === searchId.trim());
    setCheckedTicket(ticket || null);
    if (!ticket) toast.error("Không tìm thấy vé với mã này.");
  };

  const handleToggleLock = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      toast.success(t.isLocked ? "Đã mở khóa vé" : "Đã khóa vé bất thường");
      return { ...t, isLocked: !t.isLocked };
    }));
    if (checkedTicket?.id === ticketId) setCheckedTicket((prev: any) => ({ ...prev, isLocked: !prev.isLocked }));
  };

  const handleReissue = (ticketId: string) => {
    toast.success(`Đã cấp lại vé ${ticketId} thành công!`);
  };

  const checkedIn = tickets.filter(t => t.isCheckedIn).length;
  const locked = tickets.filter(t => t.isLocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">E-ticket & Check-in 📱</h1>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi và kiểm soát trạng thái vé điện tử.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng vé", value: tickets.length, color: "text-foreground" },
          { label: "Đã check-in", value: checkedIn, color: "text-emerald-500" },
          { label: "Chưa check-in", value: tickets.length - checkedIn, color: "text-blue-500" },
          { label: "Vé bị khóa", value: locked, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label} className="rounded-xl border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Lookup */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" /> Tra cứu vé nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nhập Ticket ID (VD: LM20260001)..."
              className="rounded-xl"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <Button className="rounded-xl" onClick={handleSearch}>Tra cứu</Button>
          </div>

          {checkedTicket && (
            <div className="border border-border/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-base">Ticket ID: #{checkedTicket.id}</p>
                    {checkedTicket.isLocked && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">🔒 Bị khóa</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{checkedTicket.event} · {checkedTicket.type}</p>
                  <p className="text-sm font-medium mt-1">Chủ vé: {checkedTicket.holder}</p>
                </div>
                {/* QR Code placeholder */}
                <div className="w-20 h-20 bg-muted/50 rounded-xl flex items-center justify-center border border-border/50 shrink-0">
                  <QrCode className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm ${checkedTicket.isCheckedIn ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                {checkedTicket.isCheckedIn
                  ? <><CheckCircle2 className="h-4 w-4" /> ✓ Đã sử dụng – {checkedTicket.checkedInAt}</>
                  : <><Clock className="h-4 w-4" /> ✓ Chưa check-in – Vé hợp lệ</>
                }
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-xl gap-1.5 ${checkedTicket.isLocked ? "text-emerald-600 border-emerald-200" : "text-red-600 border-red-200"}`}
                  onClick={() => handleToggleLock(checkedTicket.id)}
                >
                  {checkedTicket.isLocked ? <><Shield className="h-3.5 w-3.5" /> Mở khóa</> : <><Ban className="h-3.5 w-3.5" /> Khóa vé</>}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => handleReissue(checkedTicket.id)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Cấp lại vé
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All tickets */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm vé theo ID, người dùng, sự kiện..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-bold text-xs uppercase tracking-wider">Ticket ID</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Sự kiện</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Chủ vé</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(ticket => (
                <TableRow key={ticket.id} className="hover:bg-muted/20">
                  <TableCell><p className="font-mono font-bold text-sm">{ticket.id}</p></TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-sm">{ticket.event}</p>
                    <p className="text-xs text-muted-foreground">{ticket.type}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><p className="text-sm">{ticket.holder}</p></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${ticket.isCheckedIn ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                        {ticket.isCheckedIn ? "✓ Đã dùng" : "Chưa dùng"}
                      </span>
                      {ticket.isLocked && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 w-fit">🔒 Khóa</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setSearchId(ticket.id); setCheckedTicket(ticket); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${ticket.isLocked ? "text-emerald-500" : "text-red-500"}`} onClick={() => handleToggleLock(ticket.id)}>
                        {ticket.isLocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
