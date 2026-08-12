"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, ShieldCheck, Tag, User, Ticket as TicketIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─────────────────────────────────────────────
// Barcode SVG renderer (shared, reusable)
// ─────────────────────────────────────────────
export function BarcodeImage({
  text,
  height = 55,
  width = 1.6,
  fontSize = 11,
  displayValue = false,
  dark = false,
}: {
  text: string;
  height?: number;
  width?: number;
  fontSize?: number;
  displayValue?: boolean;
  dark?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && text) {
      try {
        JsBarcode(svgRef.current, text, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize,
          font: "monospace",
          margin: 4,
          background: dark ? "#1A2030" : "#FFFFFF",
          lineColor: dark ? "#4ade80" : "#0F172A",
        });
      } catch (err) {
        console.error("Barcode error:", err);
      }
    }
  }, [text, height, width, fontSize, displayValue, dark]);

  return <svg ref={svgRef} className="max-w-full h-auto mx-auto block" />;
}

// ─────────────────────────────────────────────
// Props interface
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Status badge helper
// ─────────────────────────────────────────────
function StatusBadge({ status, isCheckedIn }: { status?: string; isCheckedIn?: boolean }) {
  if (isCheckedIn) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
        Đã Soát Vé
      </span>
    );
  }
  if (status === "CONFIRMED" || status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
        Vé Hợp Lệ
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
        Chờ Thanh Toán
      </span>
    );
  }
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-red-500/20 text-red-300 border border-red-500/30 uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        Đã Hủy
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-slate-500/20 text-slate-300 border border-slate-500/30 uppercase tracking-wide">
      Không xác định
    </span>
  );
}

// ─────────────────────────────────────────────
// Main EventTicket — NEW UNIFIED LAYOUT
// Left : Customer info (status, name, ticket type, seat) + Barcode
// Right: Event image as full background + overlay info (title, time, venue)
// ─────────────────────────────────────────────
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
  const formattedTime = format(dateObj, "HH:mm");

  return (
    <div
      className={`relative w-full rounded-[28px] overflow-hidden shadow-2xl flex flex-col sm:flex-row min-h-[320px] border border-white/10 ${className}`}
      style={{ background: "#161B22" }}
    >
      {/* Perforation notch cutouts */}
      <div
        className="absolute top-0 left-[44%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full z-30 hidden sm:block"
        style={{ background: "#0D1117" }}
      />
      <div
        className="absolute bottom-0 left-[44%] -translate-x-1/2 translate-y-1/2 w-7 h-7 rounded-full z-30 hidden sm:block"
        style={{ background: "#0D1117" }}
      />

      {/* ════ LEFT — Customer info + Barcode ════ */}
      <div
        className="w-full sm:w-[46%] flex flex-col justify-between px-5 py-5 border-b-2 sm:border-b-0 sm:border-r-2 border-dashed border-white/15 relative z-10 shrink-0"
        style={{ background: "#1A2030" }}
      >
        {/* Top: brand + status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black tracking-[0.18em] text-emerald-400 uppercase font-mono whitespace-nowrap">
              ✦ LUMORA E-TICKET
            </span>
            <StatusBadge status={status} isCheckedIn={isCheckedIn} />
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Customer details */}
          <div className="space-y-3">
            {/* Holder name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Chủ Vé
                </p>
                <p className="text-sm font-extrabold text-white truncate leading-tight">
                  {holderName || "Khách hàng Lumora"}
                </p>
              </div>
            </div>

            {/* Ticket type */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Hạng Vé
                </p>
                <p className="text-sm font-extrabold text-white truncate leading-tight">
                  {ticketType}
                </p>
              </div>
            </div>

            {/* Seat info (optional) */}
            {seatInfo && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <TicketIcon className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    Số Ghế
                  </p>
                  <p className="text-sm font-extrabold text-amber-300 truncate leading-tight">
                    {seatInfo}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Barcode */}
        <div className="mt-5 space-y-2">
          <div className="w-full h-px bg-white/10" />

          {isCheckedIn ? (
            <div className="bg-blue-900/30 border border-blue-500/25 rounded-2xl p-3 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-blue-300 uppercase tracking-wider">
                  Đã Soát Vé Xác Nhận
                </p>
                <p className="text-[10px] text-blue-400/70 font-mono mt-0.5 truncate">
                  {ticketCode}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl px-2 pt-2 pb-1.5">
              <BarcodeImage text={ticketCode} height={46} width={1.5} fontSize={10} />
              <div className="flex items-center justify-between px-1 pt-1">
                <span className="text-[9px] font-black text-slate-700 font-mono tracking-widest">
                  {ticketCode}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase">LUMORA</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════ RIGHT — Event image BG + overlay info ════ */}
      <div className="flex-1 relative min-h-[200px] sm:min-h-0 overflow-hidden">
        {/* Background: event image or gradient fallback */}
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={eventTitle}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950" />
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        {/* Category tag — top right */}
        <div className="absolute top-4 right-4 z-20">
          <span className="inline-block bg-black/50 backdrop-blur-sm text-white border border-white/20 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-md">
            {category}
          </span>
        </div>

        {/* Event info — pinned to bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20 space-y-2.5">
          <h3 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug drop-shadow-lg line-clamp-2">
            {eventTitle}
          </h3>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-[12px] sm:text-[13px] text-slate-200 font-semibold capitalize drop-shadow">
                {formattedTime} &middot; {formattedDay}, {formattedDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-[12px] sm:text-[13px] text-slate-200 font-semibold line-clamp-1 drop-shadow">
                {venue}{city ? `, ${city}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ETicketModal — dialog wrapper for ETicket
// ─────────────────────────────────────────────
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
      <DialogContent className="sm:max-w-4xl max-w-4xl w-[95vw] rounded-[28px] p-5 sm:p-7 border border-white/10 bg-[#0D1117] text-white shadow-2xl overflow-hidden">
        <DialogHeader className="pb-3 border-b border-white/10">
          <DialogTitle className="font-black text-lg flex items-center gap-2.5 text-white">
            Phôi Vé Điện Tử Chính Thức
          </DialogTitle>
          {ticket.holderName && (
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Chủ sở hữu vé:{" "}
              <span className="font-bold text-emerald-400">{ticket.holderName}</span>
            </p>
          )}
        </DialogHeader>

        <div className="py-3">
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
