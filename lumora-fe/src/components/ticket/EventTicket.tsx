"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, ShieldCheck, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─────────────────────────────────────────────
// BarcodeImage — reusable horizontal barcode
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
// Props
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
// Status badge
// ─────────────────────────────────────────────
function StatusBadge({ status, isCheckedIn }: { status?: string; isCheckedIn?: boolean }) {
  const base = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap";
  if (isCheckedIn)
    return <span className={`${base} bg-blue-500/25 text-blue-200 border border-blue-400/30`}><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />Đã Soát Vé</span>;
  if (status === "CONFIRMED" || status === "PAID")
    return <span className={`${base} bg-emerald-500/25 text-emerald-200 border border-emerald-400/30`}><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />Vé Hợp Lệ</span>;
  if (status === "PENDING")
    return <span className={`${base} bg-amber-500/25 text-amber-200 border border-amber-400/30`}><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Chờ TT</span>;
  if (status === "CANCELLED" || status === "REFUNDED")
    return <span className={`${base} bg-red-500/25 text-red-300 border border-red-400/30`}><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Đã Hủy</span>;
  return <span className={`${base} bg-slate-500/25 text-slate-300 border border-slate-400/30`}>Không xác định</span>;
}

// ─────────────────────────────────────────────
// StubBarcode — scales CODE128 SVG to fit stub width via viewBox
// ─────────────────────────────────────────────
function StubBarcode({ text }: { text: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !text) return;
    try {
      JsBarcode(el, text, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: false,
        margin: 6,
        background: "#ffffff",
        lineColor: "#111827",
      });
      const w = el.getAttribute("width");
      const h = el.getAttribute("height");
      if (w && h) {
        el.setAttribute("viewBox", `0 0 ${w} ${h}`);
        el.removeAttribute("width");
        el.removeAttribute("height");
      }
    } catch (err) {
      console.error("Barcode error:", err);
    }
  }, [text]);
  return <svg ref={svgRef} style={{ width: "100%", height: "auto", display: "block" }} />;
}

// ─────────────────────────────────────────────
// Decorative SVG sparkle/leaf overlay
// ─────────────────────────────────────────────
function DecorativeOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Botanical leaves — corners */}
      {/* Top-left leaf cluster */}
      <g opacity="0.18" stroke="white" strokeWidth="1" fill="none">
        <path d="M-10,10 Q20,40 0,70" />
        <path d="M0,10 Q30,35 10,65" />
        <path d="M-5,5 Q15,20 5,45" />
        <path d="M10,0 Q40,25 20,55" />
      </g>
      {/* Bottom-left leaves */}
      <g opacity="0.15" stroke="white" strokeWidth="1" fill="none" transform="translate(0,130) rotate(-20)">
        <path d="M-10,10 Q30,40 5,80" />
        <path d="M5,5 Q40,35 15,75" />
        <path d="M15,0 Q50,30 25,70" />
      </g>
      {/* Top-right leaves */}
      <g opacity="0.15" stroke="white" strokeWidth="1" fill="none" transform="translate(280,-10) rotate(15)">
        <path d="M10,0 Q-20,30 0,60" />
        <path d="M20,5 Q-10,35 10,65" />
        <path d="M30,0 Q0,25 20,55" />
      </g>
      {/* Bottom-right leaves */}
      <g opacity="0.13" stroke="white" strokeWidth="1" fill="none" transform="translate(290,130) rotate(25)">
        <path d="M10,0 Q-20,30 0,60" />
        <path d="M20,5 Q-10,35 10,65" />
      </g>

      {/* Sparkle stars */}
      {/* ✦ shape: 4-pointed star using two rotated lines */}
      {[
        { x: 60, y: 18, s: 5 },
        { x: 180, y: 12, s: 6 },
        { x: 290, y: 30, s: 4 },
        { x: 340, y: 80, s: 5 },
        { x: 130, y: 160, s: 4 },
        { x: 250, y: 170, s: 6 },
        { x: 50, y: 120, s: 4 },
        { x: 320, y: 150, s: 5 },
      ].map(({ x, y, s }, i) => (
        <g key={i} transform={`translate(${x},${y})`} opacity="0.55">
          <line x1={0} y1={-s} x2={0} y2={s} stroke="white" strokeWidth="1.2" />
          <line x1={-s} y1={0} x2={s} y2={0} stroke="white" strokeWidth="1.2" />
          <line x1={-s * 0.5} y1={-s * 0.5} x2={s * 0.5} y2={s * 0.5} stroke="white" strokeWidth="0.7" />
          <line x1={s * 0.5} y1={-s * 0.5} x2={-s * 0.5} y2={s * 0.5} stroke="white" strokeWidth="0.7" />
        </g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main EventTicket
//
// ┌──────────────────────────────────────────────┬────────────┐
// │  [Purple→Blue gradient + botanical + sparks] │   WHITE    │
// │                                              │   stub     │
// │  "✦ LUMORA · {category}"      (top small)    │   NO.      │
// │                                              │            │
// │  {eventTitle}    (large bold, peach/coral)   │   ▌▌▌▌▌   │
// │  {ticketType}    (script italic white)       │   ▌▌▌▌▌   │
// │                                              │  BARCODE   │
// │  ┌─────────────────────────────────────┐     │            │
// │  │ ❤ {time} · {date} | {venue}, {city} │     │   LM-XXX   │
// │  └─────────────────────────────────────┘     │            │
// │  👤 {holder}  💺 {seat}   [Status badge]     │            │
// └──────────────────────────────────────────────┴────────────┘
//              ○ notch                       ○ notch
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
  const formattedDate = format(dateObj, "d MMM yyyy", { locale: vi });
  const formattedTime = format(dateObj, "HH:mm");

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl flex flex-row ${className}`}
      style={{ minHeight: 220, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* ── Notch cutouts at the perforation line ── */}
      <div
        className="absolute top-0 right-[22%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-30 hidden sm:block"
        style={{ background: "#f3f4f6" }}
      />
      <div
        className="absolute bottom-0 right-[22%] -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full z-30 hidden sm:block"
        style={{ background: "#f3f4f6" }}
      />

      {/* ════ LEFT 78% — coloured body ════ */}
      <div
        className="relative overflow-hidden flex flex-col justify-between p-5"
        style={{
          flex: "0 0 78%",
          minWidth: 0,
          minHeight: 220,
          background: bannerUrl
            ? undefined
            : "linear-gradient(135deg, #7C3AED 0%, #6366F1 45%, #3B82F6 100%)",
        }}
      >
        {/* Banner image (if provided) */}
        {bannerUrl && (
          <>
            <img
              src={bannerUrl}
              alt={eventTitle}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark scrim for text legibility */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right,rgba(0,0,0,0.78) 0%,rgba(0,0,0,0.45) 60%,rgba(0,0,0,0.15) 100%), linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.05) 55%)",
              }}
            />
          </>
        )}

        {/* Decorative SVG layer (botanical + sparkles) */}
        <DecorativeOverlay />

        {/* ── Content (above decorations) ── */}
        <div className="relative z-10 flex flex-col justify-between h-full gap-3">

          {/* Top row: brand + category */}
          <p className="text-[10px] italic text-white/65 font-light tracking-widest">
            ✦ LUMORA · {category}
          </p>

          {/* Middle: event name + type */}
          <div className="flex-1 flex flex-col justify-center gap-1">
            <h3
              className="font-black leading-tight line-clamp-2"
              style={{
                fontSize: "clamp(1.2rem, 3.5vw, 2rem)",
                color: bannerUrl ? "#ffffff" : "#FDBA74",   /* peach/coral when gradient */
                textShadow: "0 2px 12px rgba(0,0,0,0.55)",
              }}
            >
              {eventTitle}
            </h3>
            {/* Ticket type — script-like italic */}
            <p
              className="text-white/85 font-semibold"
              style={{
                fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
                fontStyle: "italic",
                textShadow: "0 1px 6px rgba(0,0,0,0.4)",
              }}
            >
              {ticketType}
            </p>
          </div>

          {/* Bottom: info badge + holder + status */}
          <div className="space-y-2">
            {/* Teal pill badge — date + venue */}
            <div
              className="inline-flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl text-white font-semibold text-[11px] shadow-lg max-w-full"
              style={{ background: "rgba(20,184,166,0.80)", backdropFilter: "blur(8px)" }}
            >
              <Heart className="h-3 w-3 text-red-400 shrink-0 fill-red-400" />
              <span className="font-bold">{formattedTime} · {formattedDate}</span>
              <span className="opacity-60">|</span>
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{venue}{city ? `, ${city}` : ""}</span>
            </div>

            {/* Holder + seat + status */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {holderName && (
                <span className="text-[11px] text-white/80 font-medium">👤 {holderName}</span>
              )}
              {seatInfo && (
                <span className="text-[11px] text-amber-300 font-bold">💺 {seatInfo}</span>
              )}
              <StatusBadge status={status} isCheckedIn={isCheckedIn} />
            </div>
          </div>
        </div>
      </div>

      {/* ════ RIGHT 22% — White stub ════ */}
      <div
        className="flex flex-col items-center justify-between py-4 px-2.5"
        style={{
          flex: "0 0 22%",
          minWidth: 0,
          background: "#ffffff",
          borderLeft: "2px dashed #d1d5db",
        }}
      >
        {/* NO. label */}
        <span
          className="text-slate-400 font-black uppercase tracking-[0.15em]"
          style={{ fontSize: 9, fontFamily: "monospace" }}
        >
          NO.
        </span>

        {/* Barcode */}
        {isCheckedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2">
            <ShieldCheck className="h-8 w-8 text-teal-500" />
            <p className="text-[8px] font-black text-teal-600 uppercase tracking-wider text-center leading-tight">
              Đã Soát Vé
            </p>
          </div>
        ) : (
          <div className="flex-1 w-full flex items-center justify-center py-2">
            <StubBarcode text={ticketCode} />
          </div>
        )}

        {/* Code text */}
        <p
          className="text-center break-all leading-tight text-slate-400 font-mono font-bold"
          style={{ fontSize: 7 }}
        >
          {ticketCode}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ETicketModal
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
      <DialogContent className="sm:max-w-3xl max-w-3xl w-[95vw] rounded-2xl p-5 sm:p-6 bg-slate-100 shadow-2xl overflow-hidden border-0">
        <DialogHeader className="pb-3 border-b border-slate-200">
          <DialogTitle className="font-black text-lg text-slate-800">
            🎫 Phôi Vé Điện Tử
          </DialogTitle>
          {ticket.holderName && (
            <p className="text-xs text-slate-500 mt-0.5">
              Chủ sở hữu:{" "}
              <span className="font-bold text-violet-600">{ticket.holderName}</span>
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
