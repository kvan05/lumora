"use client";

import { useState } from "react";
import { Barcode, Search, CheckCircle2, XCircle, Clock, Ban, RotateCcw, Shield, Eye, Ticket as TicketIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { BarcodeImage, ETicketModal } from "@/components/ticket/EventTicket";

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
  const [modalTicket, setModalTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = tickets.filter(t =>
    !search || t.id.toLowerCase().includes(search.toLowerCase()) || t.holder.toLowerCase().includes(search.toLowerCase()) || t.event.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearch = () => {
    const ticket = tickets.find(t => t.id === searchId.trim());
    setCheckedTicket(ticket || null);
    if (!ticket) toast.error("Không tìm thấy vé với mã này.");
  };

  const handleOpenModal = (ticket: any) => {
    setModalTicket({
      ticketCode: ticket.id,
      eventTitle: ticket.event,
      category: "Sự kiện",
      ticketType: ticket.type,
      startDate: new Date(),
      venue: "Trung tâm Hội nghị Lumora Center",
      city: "TP. Hồ Chí Minh",
      status: ticket.isLocked ? "CANCELLED" : "CONFIRMED",
      isCheckedIn: ticket.isCheckedIn,
      holderName: ticket.holder,
    });
    setIsModalOpen(true);
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
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Barcode className="h-6 w-6 text-primary" /> E-ticket & Check-in (Mã Vạch Barcode)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi và kiểm soát trạng thái vé điện tử có mã vạch.</p>
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
            <Search className="h-4 w-4 text-primary" /> Tra cứu phôi vé & Barcode nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nhập Ticket ID (VD: LM20260001)..."
              className="rounded-xl font-mono uppercase"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <Button className="rounded-xl font-bold" onClick={handleSearch}>Tra cứu</Button>
          </div>

          {checkedTicket && (
            <div className="border border-border/50 rounded-2xl p-4 space-y-4 bg-muted/10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-black text-lg">Ticket ID: #{checkedTicket.id}</p>
                    {checkedTicket.isLocked && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">🔒 Bị khóa</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{checkedTicket.event} · <span className="font-semibold text-foreground">{checkedTicket.type}</span></p>
                  <p className="text-sm font-medium mt-1">Chủ sở hữu vé: <span className="font-bold text-primary">{checkedTicket.holder}</span></p>
                </div>
                
                {/* Barcode Image preview box */}
                <div className="bg-white p-3 rounded-2xl border border-border/60 shadow-xs flex flex-col items-center shrink-0">
                  <BarcodeImage text={checkedTicket.id} height={46} width={1.5} fontSize={11} />
                </div>
              </div>

              <div className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm ${checkedTicket.isCheckedIn ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"}`}>
                <div className="flex items-center gap-2">
                  {checkedTicket.isCheckedIn
                    ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> ✓ Đã sử dụng – {checkedTicket.checkedInAt}</>
                    : <><Clock className="h-4 w-4 text-blue-600" /> ✓ Chưa check-in – Vé hợp lệ</>
                  }
                </div>
                <Button size="sm" variant="secondary" className="rounded-lg h-8 gap-1.5 font-bold" onClick={() => handleOpenModal(checkedTicket)}>
                  <Eye className="h-3.5 w-3.5" /> Xem Phôi Vé Chân Thực
                </Button>
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
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm vé theo ID, người dùng, sự kiện..." className="pl-9 h-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-bold text-xs uppercase tracking-wider">Mã Vạch / Ticket ID</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Sự kiện</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider hidden md:table-cell">Chủ vé</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Xem phôi vé & Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(ticket => (
                <TableRow key={ticket.id} className="hover:bg-muted/20">
                  <TableCell>
                    <p className="font-mono font-bold text-sm text-primary">{ticket.id}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <p className="text-sm font-medium">{ticket.event}</p>
                    <p className="text-xs text-muted-foreground">{ticket.type}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell"><p className="text-sm font-medium">{ticket.holder}</p></TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${ticket.isCheckedIn ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                        {ticket.isCheckedIn ? "✓ Đã dùng" : "Chưa dùng"}
                      </span>
                      {ticket.isLocked && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 w-fit">🔒 Khóa</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => handleOpenModal(ticket)}
                      >
                        <Barcode className="h-3.5 w-3.5" /> Xem Phôi Vé
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

      {/* ETicket Modal Component */}
      <ETicketModal open={isModalOpen} onOpenChange={setIsModalOpen} ticket={modalTicket} />
    </div>
  );
}

