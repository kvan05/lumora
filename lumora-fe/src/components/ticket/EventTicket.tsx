"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, ShieldCheck, Heart, Download, ZoomIn, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─────────────────────────────────────────────
// QRCodeImage — reusable QR code canvas
// ─────────────────────────────────────────────
export function QRCodeImage({
  text,
  size = 160,
  dark = false,
}: {
  text: string;
  size?: number;
  dark?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    QRCode.toCanvas(canvasRef.current, text, {
      width: size,
      margin: 2,
      color: {
        dark: dark ? "#4ade80" : "#0F172A",
        light: dark ? "#1A2030" : "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    }).catch((err) => console.error("QR error:", err));
  }, [text, size, dark]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="mx-auto block"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ─────────────────────────────────────────────
// StubQRCode — small QR for the ticket stub
// ─────────────────────────────────────────────
function StubQRCode({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    QRCode.toCanvas(canvasRef.current, text, {
      width: 140,
      margin: 0,
      color: { dark: "#111827", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).catch((err) => console.error("QR stub error:", err));
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={140}
      style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated" }}
    />
  );
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
export interface EventTicketProps {
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
  showDownloadBtn?: boolean;
}

// ─────────────────────────────────────────────
// High-res E-Ticket Canvas Image Downloader Function
// ─────────────────────────────────────────────
export async function downloadTicketImage(ticket: {
  ticketCode: string;
  eventTitle: string;
  bannerUrl?: string | null;
  category?: string;
  ticketType?: string;
  startDate?: string | Date;
  venue?: string;
  city?: string;
  seatInfo?: string;
  holderName?: string;
}) {
  const canvas = document.createElement("canvas");
  const width = 1050;
  const height = 460;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const leftWidth = 760;

  // 1. Draw Left Ticket Body (Purple-Blue Gradient)
  const gradient = ctx.createLinearGradient(0, 0, leftWidth, height);
  gradient.addColorStop(0, "#7C3AED");
  gradient.addColorStop(0.5, "#6366F1");
  gradient.addColorStop(1, "#3B82F6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, leftWidth, height);

  // If banner image exists, draw it with overlay
  if (ticket.bannerUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = ticket.bannerUrl!;
      });
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, leftWidth, height);
        // Scrim gradient overlay
        const scrim = ctx.createLinearGradient(0, 0, leftWidth, 0);
        scrim.addColorStop(0, "rgba(0,0,0,0.85)");
        scrim.addColorStop(0.6, "rgba(0,0,0,0.55)");
        scrim.addColorStop(1, "rgba(0,0,0,0.2)");
        ctx.fillStyle = scrim;
        ctx.fillRect(0, 0, leftWidth, height);
      }
    } catch {}
  }

  // Brand header
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "italic 16px sans-serif";
  ctx.fillText(`✦ LUMORA · ${ticket.category || "Sự kiện"}`, 40, 48);

  // Event Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 32px sans-serif";
  const title = ticket.eventTitle || "Sự kiện Lumora";
  ctx.fillText(title.length > 30 ? `${title.slice(0, 30)}...` : title, 40, 115);

  // Ticket Type
  ctx.fillStyle = "#FDBA74";
  ctx.font = "italic 22px sans-serif";
  ctx.fillText(ticket.ticketType || "Vé Tiêu Chuẩn", 40, 155);

  // Date & Location Pill Badge
  const dateObj = new Date(ticket.startDate || new Date());
  const dateStr = format(dateObj, "HH:mm · dd/MM/yyyy", { locale: vi });
  const venueStr = `${ticket.venue || "Địa điểm"}${ticket.city ? `, ${ticket.city}` : ""}`;

  ctx.fillStyle = "rgba(20, 184, 166, 0.85)";
  ctx.beginPath();
  ctx.roundRect(40, 210, 680, 52, 14);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(`📅 ${dateStr}  |  📍 ${venueStr.length > 34 ? venueStr.slice(0, 34) + "..." : venueStr}`, 56, 243);

  // Holder & Seat info
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px sans-serif";
  let infoText = "";
  if (ticket.holderName) infoText += `👤 Chủ vé: ${ticket.holderName}    `;
  if (ticket.seatInfo) infoText += `💺 ${ticket.seatInfo}`;
  if (!infoText) infoText = "👤 Khách hàng Lumora";
  ctx.fillText(infoText, 40, 315);

  // E-Ticket Official Tag
  ctx.fillStyle = "#4ADE80";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("✓ VÉ ĐIỆN TỬ CHÍNH THỨC (CÓ MÃ QR)", 40, 405);

  // 2. Perforation Dashed Line
  ctx.strokeStyle = "#D1D5DB";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(leftWidth, 0);
  ctx.lineTo(leftWidth, height);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Right Stub (White background)
  const stubWidth = 290;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(leftWidth, 0, stubWidth, height);

  // Header "MÃ QR SOÁT VÉ"
  ctx.fillStyle = "#475569";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MÃ QR SOÁT VÉ", leftWidth + stubWidth / 2, 45);

  // Render QR Code onto Stub Canvas
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, ticket.ticketCode, {
    width: 240,
    margin: 1,
    color: { dark: "#0F172A", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });
  ctx.drawImage(qrCanvas, leftWidth + (stubWidth - 240) / 2, 70, 240, 240);

  // Ticket Code Text
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 18px monospace";
  ctx.fillText(ticket.ticketCode, leftWidth + stubWidth / 2, 345);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "13px sans-serif";
  ctx.fillText("Quét mã tại cổng để vào sự kiện", leftWidth + stubWidth / 2, 385);

  // Download Trigger
  const link = document.createElement("a");
  link.download = `Ve-Dien-Tu-LUMORA-${ticket.ticketCode}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
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
      <g opacity="0.18" stroke="white" strokeWidth="1" fill="none">
        <path d="M-10,10 Q20,40 0,70" />
        <path d="M0,10 Q30,35 10,65" />
        <path d="M-5,5 Q15,20 5,45" />
        <path d="M10,0 Q40,25 20,55" />
      </g>
      <g opacity="0.15" stroke="white" strokeWidth="1" fill="none" transform="translate(0,130) rotate(-20)">
        <path d="M-10,10 Q30,40 5,80" />
        <path d="M5,5 Q40,35 15,75" />
        <path d="M15,0 Q50,30 25,70" />
      </g>
      <g opacity="0.15" stroke="white" strokeWidth="1" fill="none" transform="translate(280,-10) rotate(15)">
        <path d="M10,0 Q-20,30 0,60" />
        <path d="M20,5 Q-10,35 10,65" />
        <path d="M30,0 Q0,25 20,55" />
      </g>
      <g opacity="0.13" stroke="white" strokeWidth="1" fill="none" transform="translate(290,130) rotate(25)">
        <path d="M10,0 Q-20,30 0,60" />
        <path d="M20,5 Q-10,35 10,65" />
      </g>

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
// Main EventTicket Component
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
  showDownloadBtn = true,
}: EventTicketProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const dateObj = new Date(startDate);
  const formattedDate = format(dateObj, "d MMM yyyy", { locale: vi });
  const formattedTime = format(dateObj, "HH:mm");

  const handleSaveImage = async () => {
    setIsDownloading(true);
    try {
      await downloadTicketImage({
        ticketCode,
        eventTitle,
        bannerUrl,
        category,
        ticketType,
        startDate,
        venue,
        city,
        seatInfo,
        holderName,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full rounded-2xl overflow-hidden shadow-xl flex flex-row ${className}`}
        style={{ minHeight: 200, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
      >
        {/* Notch cutouts */}
        <div
          className="absolute top-0 right-[140px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-30 hidden sm:block"
          style={{ background: "#f3f4f6" }}
        />
        <div
          className="absolute bottom-0 right-[140px] -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full z-30 hidden sm:block"
          style={{ background: "#f3f4f6" }}
        />

        {/* LEFT Body — Flex 1 */}
        <div
          className="relative overflow-hidden flex flex-col justify-between p-4 sm:p-5 flex-1 min-w-0"
          style={{
            minHeight: 200,
            background: bannerUrl
              ? undefined
              : "linear-gradient(135deg, #7C3AED 0%, #6366F1 45%, #3B82F6 100%)",
          }}
        >
          {bannerUrl && (
            <>
              <img
                src={bannerUrl}
                alt={eventTitle}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right,rgba(0,0,0,0.78) 0%,rgba(0,0,0,0.45) 60%,rgba(0,0,0,0.15) 100%), linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.05) 55%)",
                }}
              />
            </>
          )}

          <DecorativeOverlay />

          <div className="relative z-10 flex flex-col justify-between h-full gap-3">
            <p className="text-[10px] italic text-white/65 font-light tracking-widest">
              ✦ LUMORA · {category}
            </p>

            <div className="flex-1 flex flex-col justify-center gap-1">
              <h3
                className="font-black leading-tight line-clamp-2"
                style={{
                  fontSize: "clamp(1.2rem, 3.5vw, 2rem)",
                  color: bannerUrl ? "#ffffff" : "#FDBA74",
                  textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                }}
              >
                {eventTitle}
              </h3>
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

            <div className="space-y-2">
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

        {/* RIGHT Stub — Fixed 140px */}
        <div
          className="flex flex-col items-center justify-between py-4 px-3 shrink-0 w-[140px]"
          style={{
            background: "#ffffff",
            borderLeft: "2px dashed #e2e8f0",
          }}
        >
          <span
            className="text-slate-400 font-black uppercase tracking-[0.15em]"
            style={{ fontSize: 9, fontFamily: "monospace" }}
          >
            MÃ QR
          </span>

          {isCheckedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2">
              <ShieldCheck className="h-8 w-8 text-teal-500" />
              <p className="text-[8px] font-black text-teal-600 uppercase tracking-wider text-center leading-tight">
                Đã Soát Vé
              </p>
            </div>
          ) : (
            <div className="flex-1 w-full flex items-center justify-center py-2">
              <StubQRCode text={ticketCode} />
            </div>
          )}

          <p
            className="text-center break-all leading-tight text-slate-400 font-mono font-bold"
            style={{ fontSize: 7 }}
          >
            {ticketCode}
          </p>
        </div>
      </div>

      {/* Action Download Ticket Image Button */}
      {showDownloadBtn && (
        <div className="flex justify-end no-print pt-1">
          <button
            onClick={handleSaveImage}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloading ? "Đang tạo ảnh vé..." : "Lưu vé điện tử (Ảnh QR) về máy"}
          </button>
        </div>
      )}
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
  const [showFullQR, setShowFullQR] = useState(false);
  const [isDownloadingFull, setIsDownloadingFull] = useState(false);

  const handleDownloadQR = async () => {
    if (!ticket?.ticketCode) return;
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, ticket.ticketCode, {
      width: 400,
      margin: 2,
      color: { dark: "#0F172A", light: "#FFFFFF" },
      errorCorrectionLevel: "H",
    });
    const link = document.createElement("a");
    link.download = `qr-${ticket.ticketCode}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleDownloadFullTicket = async () => {
    if (!ticket) return;
    setIsDownloadingFull(true);
    try {
      await downloadTicketImage({
        ticketCode: ticket.ticketCode,
        eventTitle: ticket.eventTitle,
        bannerUrl: ticket.bannerUrl,
        category: ticket.category,
        ticketType: ticket.ticketType,
        startDate: ticket.startDate,
        venue: ticket.venue,
        city: ticket.city,
        seatInfo: ticket.seatInfo,
        holderName: ticket.holderName,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingFull(false);
    }
  };

  if (!ticket) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-w-3xl w-[95vw] rounded-2xl p-5 sm:p-6 bg-slate-100 shadow-2xl overflow-hidden border-0">
        <DialogHeader className="pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-black text-lg text-slate-800">
              🎫 Phôi Vé Điện Tử
            </DialogTitle>
            <button
              onClick={handleDownloadFullTicket}
              disabled={isDownloadingFull}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {isDownloadingFull ? "Đang tạo ảnh vé..." : "Lưu phôi vé có QR"}
            </button>
          </div>
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
            showDownloadBtn={true}
          />
        </div>

        {/* QR code standalone section */}
        <div className="border-t border-slate-200 pt-4 flex flex-col items-center gap-3">
          <p className="text-xs text-slate-500 font-medium">Mã QR để soát vé</p>
          {showFullQR ? (
            <QRCodeImage text={ticket.ticketCode} size={220} />
          ) : (
            <QRCodeImage text={ticket.ticketCode} size={150} />
          )}
          <p className="font-mono text-xs text-slate-500 tracking-widest">{ticket.ticketCode}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFullQR((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              {showFullQR ? "Thu nhỏ" : "Phóng to"}
            </button>
            <button
              onClick={handleDownloadFullTicket}
              disabled={isDownloadingFull}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {isDownloadingFull ? "Đang tạo vé..." : "Lưu vé (Có QR) về máy"}
            </button>
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Tải riêng mã QR
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
