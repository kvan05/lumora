"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, Tag, ShieldCheck, Armchair, Sparkles, User, Ticket as TicketIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EventTicketProps {
  ticketCode: string;
  eventTitle: string;
  bannerUrl?: string | null;
  category?: string;
  ticketType?: string;
  startDate: string | Date;
  venue: string;
  city: string;
  seatInfo?: string;
  status?: string;
  isCheckedIn?: boolean;
  holderName?: string;
  className?: string;
}

export function BarcodeImage({
  text,
  height = 55,
  width = 1.6,
  fontSize = 11,
  displayValue = false,
}: {
  text: string;
  height?: number;
  width?: number;
  fontSize?: number;
  displayValue?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && text) {
      try {
        JsBarcode(svgRef.current, text, {
          format: "CODE128",
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          font: "monospace",
          margin: 4,
          background: "#FFFFFF",
          lineColor: "#0F172A",
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [text, height, width, fontSize, displayValue]);

  return <svg ref={svgRef} className="max-w-full h-auto mx-auto rounded-xs block" />;
}

export function EventTicket({
  ticketCode,
  eventTitle,
  bannerUrl,
  category = "Sự kiện",
  ticketType = "Vé Tiêu Chuẩn",
  startDate,
  venue,
  city,
  seatInfo,
  status = "CONFIRMED",
  isCheckedIn = false,
  holderName,
  className = "",
}: EventTicketProps) {
  const dateObj = new Date(startDate);
  const formattedDay = format(dateObj, "EEEE", { locale: vi });
  const formattedDate = format(dateObj, "d 'Tháng' M, yyyy", { locale: vi });
  const formattedTime = format(dateObj, "HH:mm", { locale: vi });

  return (
    <div
      className={`relative w-full rounded-[32px] overflow-hidden shadow-2xl bg-[#1E242B] text-white flex flex-row min-h-[320px] md:min-h-[380px] border border-white/10 ${className}`}
    >
      {/* SEMI-CIRCULAR CUTOUT NOTCHES (TOP & BOTTOM PERFORATION CUTOUTS - STYLE TICKETBOX) */}
      <div className="absolute top-0 left-[38%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#12161B] border border-white/15 z-30 shadow-inner" />
      <div className="absolute bottom-0 left-[38%] -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-[#12161B] border border-white/15 z-30 shadow-inner" />

      {/* LEFT SECTION: TICKET DETAILS STUB (THÂN VÉ TRÁI - DARK SLATE INFO) */}
      <div className="w-[42%] md:w-[38%] p-5 md:p-8 bg-[#181D23] border-r-2 border-dashed border-white/20 flex flex-col justify-between relative z-10 shrink-0">
        
        {/* Top Header */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-emerald-400 font-mono">
              ✦ LUMORA E-TICKET
            </span>
            {isCheckedIn ? (
              <Badge className="bg-blue-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-xl">
                ✓ Đã soát vé
              </Badge>
            ) : status === "CONFIRMED" ? (
              <Badge className="bg-emerald-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-xl">
                ✓ Vé Hợp Lệ
              </Badge>
            ) : status === "PENDING" ? (
              <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-xl">
                ⏳ Chờ thanh toán
              </Badge>
            ) : (
              <Badge variant="destructive" className="font-extrabold text-[11px] px-2.5 py-0.5 rounded-xl">
                ✕ Đã hủy
              </Badge>
            )}
          </div>

          <h2 className="text-base md:text-2xl font-black tracking-tight text-white leading-tight line-clamp-2">
            {eventTitle}
          </h2>
        </div>

        {/* Middle Event Meta Info (Time & Venue) */}
        <div className="space-y-2.5 py-2 border-y border-white/10 my-1">
          {/* Time */}
          <div className="flex items-start gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Thời gian</p>
              <p className="text-xs md:text-sm font-bold text-white capitalize mt-0.5">
                {formattedTime}, {formattedDay} — {formattedDate}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">{venue}</p>
              <p className="text-xs text-slate-300 font-medium truncate mt-0.5">{city}</p>
            </div>
          </div>
        </div>

        {/* Bottom Details & Barcode Box */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] md:text-xs bg-white/5 p-2 md:p-2.5 rounded-xl border border-white/10">
            <div>
              <span className="text-slate-400 text-[10px] block">Hạng vé:</span>
              <span className="font-extrabold text-white">{ticketType}</span>
            </div>
            {seatInfo && (
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Số ghế:</span>
                <span className="font-extrabold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                  {seatInfo}
                </span>
              </div>
            )}
            {holderName && (
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Chủ vé:</span>
                <span className="font-bold text-white truncate max-w-[90px] inline-block">{holderName}</span>
              </div>
            )}
          </div>

          {/* Barcode SVG Container inside Left Stub */}
          <div className="bg-white text-slate-950 p-2 md:p-2.5 rounded-2xl shadow-lg border border-white/20 relative overflow-hidden flex flex-col items-center">
            <BarcodeImage text={ticketCode} height={42} width={1.5} fontSize={10} />
            <div className="w-full text-center border-t border-slate-200 pt-1 mt-1 flex items-center justify-between px-1 text-[9px] font-mono">
              <span className="font-black text-slate-900 tracking-wider">MÃ: {ticketCode}</span>
              <span className="text-slate-500 font-bold uppercase hidden sm:inline">LUMORA</span>
            </div>

            {isCheckedIn && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex items-center justify-center rounded-2xl gap-2 p-2">
                <ShieldCheck className="h-6 w-6 text-blue-600 animate-bounce" />
                <span className="text-xs font-black text-blue-700">ĐÃ SOÁT VÉ XÁC NHẬN</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT SECTION: LARGE HUGE EVENT COVER BANNER IMAGE (STYLE TICKETBOX BANNER LỚN) */}
      <div className="flex-1 relative min-h-[300px] overflow-hidden bg-slate-950">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={eventTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 flex flex-col items-center justify-center p-8 text-center">
            <TicketIcon className="h-16 w-16 text-emerald-400/50 mb-2" />
            <span className="text-lg font-black text-white/80">{eventTitle}</span>
          </div>
        )}
        
        {/* Subtle Inner Glow Vignette */}
        <div className="absolute inset-0 shadow-inner pointer-events-none bg-gradient-to-r from-black/40 via-transparent to-black/20" />

        {/* Top Right Floating Badge */}
        <div className="absolute top-4 right-4 z-20">
          <Badge className="bg-black/60 backdrop-blur-md text-white border border-white/20 px-3 py-1 rounded-xl font-extrabold text-[11px] uppercase tracking-wider shadow-lg">
            {category}
          </Badge>
        </div>
      </div>

    </div>
  );
}

export function ETicketModal({
  open,
  onOpenChange,
  ticket,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    ticketCode: string;
    eventTitle: string;
    bannerUrl?: string | null;
    category?: string;
    ticketType?: string;
    startDate?: string | Date;
    venue?: string;
    city?: string;
    seatInfo?: string;
    status?: string;
    isCheckedIn?: boolean;
    holderName?: string;
  } | null;
}) {
  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl md:max-w-6xl max-w-6xl w-[95vw] rounded-[36px] p-5 md:p-8 border-2 border-white/20 bg-[#12161B] text-white shadow-2xl overflow-hidden">
        <DialogHeader className="pb-3 border-b border-white/10">
          <DialogTitle className="font-black text-xl md:text-2xl flex items-center gap-2.5 text-white">
            🎟️ Phôi Vé Điện Tử Chính Thức (Ticketbox Large Banner Style)
          </DialogTitle>
          {ticket.holderName && (
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Chủ sở hữu vé: <span className="font-bold text-emerald-400">{ticket.holderName}</span>
            </p>
          )}
        </DialogHeader>
        <div className="py-3 overflow-x-auto">
          <EventTicket
            ticketCode={ticket.ticketCode}
            eventTitle={ticket.eventTitle || "Sự kiện Lumora"}
            bannerUrl={ticket.bannerUrl}
            category={ticket.category || "Sự kiện"}
            ticketType={ticket.ticketType || "Vé Tiêu Chuẩn"}
            startDate={ticket.startDate || new Date()}
            venue={ticket.venue || "Địa điểm sự kiện"}
            city={ticket.city || "Việt Nam"}
            seatInfo={ticket.seatInfo}
            status={ticket.status || "CONFIRMED"}
            isCheckedIn={ticket.isCheckedIn || false}
            holderName={ticket.holderName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
