"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import staffApi from "@/lib/staff-api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft, Camera, CameraOff, ScanLine, Keyboard, CheckCircle2,
  XCircle, AlertTriangle, Clock, User, Ticket, MapPin, List,
  ChevronDown, ChevronUp, Loader2, Volume2, VolumeX, RefreshCw, X, ArrowRight, CornerDownLeft
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/* ─────────────────────────── Types ─────────────────────────────────── */
type ScanAction = "SUCCESS" | "ALREADY_CHECKED_IN" | "WRONG_EVENT" | "INVALID" | "CANCELLED" | null;

interface ScanResult {
  success: boolean;
  action: ScanAction;
  message: string;
  ticketCode?: string;
  data?: {
    checkedInAt?: string;
    buyer?: { name: string | null; email: string; phone: string | null; avatar: string | null };
    ticketType?: { name: string; price: number; color: string | null };
    seat?: { seatLabel: string; seatNumber: string } | null;
    orderNumber?: string;
    eventTitle?: string;
    ticketCode?: string;
  };
}

interface RecentScan {
  code: string;
  action: ScanAction;
  time: Date;
  buyerName?: string;
  ticketType?: string;
}

/* ─────────────────────────── Audio Feedback ─────────────────────────── */
function playBeep(type: "success" | "warning" | "error", muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "success") {
      osc.frequency.value = 880; osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    } else if (type === "warning") {
      osc.frequency.value = 520; osc.type = "triangle";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.start(); osc.stop(ctx.currentTime + 0.45);
    } else {
      osc.frequency.value = 240; osc.type = "square";
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    }
  } catch { /* AudioContext restriction */ }
}

/* ─────────────────────────── Page ──────────────────────────────────── */
export default function StaffScanPage() {
  const router = useRouter();
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();

  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  const scannerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScannedCode = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // ─── Event detail query ───
  const { data: eventData } = useQuery({
    queryKey: ["staff-event-detail", eventId],
    queryFn: async () => {
      const res = await staffApi.get(`/staff/events/${eventId}`);
      return res.data.data;
    },
  });

  const eventInfo = eventData?.event;
  const stats = eventData?.stats;

  // ─── Check-in mutation ───
  const checkinMutation = useMutation({
    mutationFn: (code: string) =>
      staffApi.post("/staff/checkin", { code, eventId }),
    onSuccess: (res, code) => {
      const result: ScanResult = { ...res.data, ticketCode: code };
      setScanResult(result);
      qc.invalidateQueries({ queryKey: ["staff-event-detail", eventId] });

      // Add to recent scans list
      const newScan: RecentScan = {
        code,
        action: result.action,
        time: new Date(),
        buyerName: result.data?.buyer?.name || result.data?.buyer?.email,
        ticketType: result.data?.ticketType?.name,
      };
      setRecentScans((prev) => [newScan, ...prev].slice(0, 30));

      // Play audio feedback
      if (result.action === "SUCCESS") playBeep("success", isMuted);
      else if (result.action === "ALREADY_CHECKED_IN") playBeep("warning", isMuted);
      else playBeep("error", isMuted);
    },
    onError: (err: any, code) => {
      const apiResult: ScanResult = {
        success: false,
        action: err?.response?.data?.action || "INVALID",
        message: err?.response?.data?.message || "Vé không hợp lệ hoặc không tồn tại",
        ticketCode: code,
        data: err?.response?.data?.data,
      };
      setScanResult(apiResult);
      playBeep(apiResult.action === "ALREADY_CHECKED_IN" ? "warning" : "error", isMuted);
    },
  });

  // Handle Scan Code (Debounced & Paused)
  const handleScan = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Ignore if currently processing, or showing modal result, or same code
    if (isProcessingRef.current || lastScannedCode.current === trimmed) return;

    isProcessingRef.current = true;
    lastScannedCode.current = trimmed;

    // Pause html5-qrcode scanner while displaying result
    try {
      if (scannerRef.current) {
        scannerRef.current.pause(true);
      }
    } catch {}

    checkinMutation.mutate(trimmed);
  }, [checkinMutation]);

  // Resume Scanning (Triggered when user clicks "Quét Vé Tiếp Theo")
  const handleResumeScan = useCallback(() => {
    setScanResult(null);
    lastScannedCode.current = null;
    isProcessingRef.current = false;

    // Resume html5-qrcode scanner
    try {
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    } catch {}

    if (mode === "manual") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mode]);

  // Keydown listener for Enter / Space to quickly continue scanning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scanResult && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
        e.preventDefault();
        handleResumeScan();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scanResult, handleResumeScan]);

  // ─── Camera Scanner Manager ───
  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }
    startCamera();
    return () => { stopCamera(); };
  }, [mode]);

  async function startCamera() {
    setCameraError(null);
    setIsCameraActive(false);
    setScannerReady(false);

    try {
      if (typeof window === "undefined") return;
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!document.getElementById("qr-reader")) return;

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        (decodedText) => handleScan(decodedText),
        () => {}
      );

      setIsCameraActive(true);
      setScannerReady(true);
    } catch (err: any) {
      setCameraError(
        err?.message?.includes("NotAllowed")
          ? "Vui lòng cấp quyền truy cập camera để quét mã QR"
          : "Không thể khởi động camera. Thử dùng nhập mã thủ công."
      );
    }
  }

  async function stopCamera() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
    } catch { /* ignore */ }
    setIsCameraActive(false);
    setScannerReady(false);
  }

  // ─── Manual Input Mode ───
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || isProcessingRef.current) return;
    handleScan(manualCode);
    setManualCode("");
  };

  useEffect(() => {
    if (mode === "manual") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  /* ─── Result Modal Overlay Configuration ─── */
  const resultConfig: Record<string, { bg: string; border: string; badgeBg: string; text: string; icon: React.ReactNode; label: string }> = {
    SUCCESS: {
      bg: "bg-emerald-950/90", border: "border-emerald-500/50", badgeBg: "bg-emerald-500 text-white", text: "text-emerald-400",
      icon: <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />, label: "CHECK-IN THÀNH CÔNG"
    },
    ALREADY_CHECKED_IN: {
      bg: "bg-amber-950/90", border: "border-amber-500/50", badgeBg: "bg-amber-500 text-white", text: "text-amber-400",
      icon: <AlertTriangle className="w-16 h-16 text-amber-400" />, label: "ĐÃ CHECK-IN TRƯỚC ĐÓ"
    },
    WRONG_EVENT: {
      bg: "bg-orange-950/90", border: "border-orange-500/50", badgeBg: "bg-orange-500 text-white", text: "text-orange-400",
      icon: <XCircle className="w-16 h-16 text-orange-400" />, label: "SAI SỰ KIỆN"
    },
    INVALID: {
      bg: "bg-rose-950/90", border: "border-rose-500/50", badgeBg: "bg-rose-500 text-white", text: "text-rose-400",
      icon: <XCircle className="w-16 h-16 text-rose-400" />, label: "VÉ KHÔNG HỢP LỆ"
    },
    CANCELLED: {
      bg: "bg-rose-950/90", border: "border-rose-500/50", badgeBg: "bg-rose-500 text-white", text: "text-rose-400",
      icon: <XCircle className="w-16 h-16 text-rose-400" />, label: "VÉ ĐÃ HỦY"
    },
  };

  const rc = scanResult?.action ? resultConfig[scanResult.action] : null;

  return (
    <div className="min-h-screen bg-[#060610] flex flex-col select-none">
      {/* Header Bar */}
      <div className="sticky top-0 z-30 bg-[#060610]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{eventInfo?.title || "Đang tải..."}</p>
            {stats && (
              <p className="text-xs text-zinc-500 mt-0.5">
                <span className="text-emerald-400 font-medium">{stats.checkedIn}</span>/{stats.totalTickets} đã check-in
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => router.push(`/staff/events/${eventId}/tickets`)}
              className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="max-w-lg mx-auto w-full px-4 pt-4">
        <div className="flex gap-2 p-1 bg-white/[0.05] rounded-xl border border-white/10">
          <button
            onClick={() => setMode("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === "camera"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Camera className="w-4 h-4" /> Camera QR Scanner
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === "manual"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Keyboard className="w-4 h-4" /> Nhập Mã Vé
          </button>
        </div>
      </div>

      {/* Main Scanner Container Area */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        {mode === "camera" ? (
          <div className="space-y-4">
            {/* QR Reader Viewport */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square shadow-2xl">
              <div id="qr-reader" className="w-full h-full" />

              {/* Scanner Overlay Frame & Aiming Reticle */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-52 h-52">
                    {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
                      <div
                        key={pos}
                        className={`absolute w-8 h-8 border-4 border-violet-400
                          ${pos === "top-left" ? "top-0 left-0 border-r-0 border-b-0 rounded-tl-xl" : ""}
                          ${pos === "top-right" ? "top-0 right-0 border-l-0 border-b-0 rounded-tr-xl" : ""}
                          ${pos === "bottom-left" ? "bottom-0 left-0 border-r-0 border-t-0 rounded-bl-xl" : ""}
                          ${pos === "bottom-right" ? "bottom-0 right-0 border-l-0 border-t-0 rounded-br-xl" : ""}
                        `}
                      />
                    ))}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-[scan_2s_linear_infinite]" />
                  </div>
                </div>
              )}

              {/* Camera Loading */}
              {!isCameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                  <p className="text-zinc-400 text-sm font-medium">Đang khởi động camera quét QR...</p>
                </div>
              )}

              {/* Camera Error */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900 p-6 text-center">
                  <CameraOff className="w-12 h-12 text-red-400" />
                  <p className="text-zinc-300 text-sm font-medium">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Thử lại
                  </button>
                </div>
              )}

              {/* Processing Overlay State */}
              {checkinMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm z-20">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                    <p className="text-white font-bold text-sm">Đang xác minh mã vé...</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-zinc-500 text-xs font-medium">
              Hướng camera vào mã QR trên vé để kiểm tra tự động
            </p>
          </div>
        ) : (
          /* Manual Input Mode */
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-5">
              <div className="text-center">
                <ScanLine className="w-10 h-10 text-violet-400 mx-auto mb-2" />
                <p className="text-white font-bold text-base">Nhập mã vé thủ công</p>
                <p className="text-zinc-400 text-xs mt-1">Dùng khi camera không đọc được mã QR</p>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  ref={inputRef}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Nhập mã vé..."
                  className="w-full px-4 py-4 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 text-base font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <button
                  type="submit"
                  disabled={checkinMutation.isPending || !manualCode.trim()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 text-white font-bold text-base transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
                >
                  {checkinMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> Kiểm tra vé</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── RECENT SCANS HISTORY ── */}
        {recentScans.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-300 text-xs font-bold">Vừa quét ({recentScans.length})</span>
              </div>
              {showRecent ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {showRecent && (
              <div className="divide-y divide-white/[0.06] max-h-60 overflow-y-auto">
                {recentScans.map((scan, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      scan.action === "SUCCESS" ? "bg-emerald-400" :
                      scan.action === "ALREADY_CHECKED_IN" ? "bg-amber-400" : "bg-red-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 font-mono font-bold truncate">{scan.code}</p>
                      {scan.buyerName && (
                        <p className="text-zinc-500 truncate">{scan.buyerName}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {format(scan.time, "HH:mm:ss")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PROMINENT SCAN RESULT POPUP MODAL (PAUSES CONTINUOUS RE-SCANNING) ── */}
      {scanResult && rc && (
        <Dialog open={!!scanResult} onOpenChange={(open) => !open && handleResumeScan()}>
          <DialogContent className={`max-w-md rounded-3xl p-6 border shadow-2xl ${rc.bg} ${rc.border} backdrop-blur-2xl text-white flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200`}>
            {/* Top Status Icon */}
            <div className="p-4 rounded-full bg-black/40 border border-white/10 shadow-inner">
              {rc.icon}
            </div>

            {/* Title & Badge */}
            <div className="space-y-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${rc.badgeBg}`}>
                {rc.label}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2 leading-tight">
                {scanResult.message}
              </h2>
              {scanResult.ticketCode && (
                <p className="text-xs font-mono font-bold text-zinc-400">
                  Mã vé: {scanResult.ticketCode}
                </p>
              )}
            </div>

            {/* Attendee & Ticket Info Breakdown */}
            {scanResult.data?.buyer && (
              <div className="w-full text-left bg-black/50 border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-zinc-400 font-medium">Khán giả mua vé</p>
                    <p className="text-white font-bold text-sm truncate">
                      {scanResult.data.buyer.name || "Khách hàng"} ({scanResult.data.buyer.email})
                    </p>
                  </div>
                </div>

                {scanResult.data.ticketType && (
                  <div className="flex items-center gap-2.5 border-t border-white/10 pt-2">
                    <Ticket className="w-4 h-4 text-fuchsia-400 shrink-0" />
                    <div>
                      <p className="text-zinc-400 font-medium">Hạng vé</p>
                      <p className="text-white font-bold text-sm">
                        {scanResult.data.ticketType.name} — {scanResult.data.ticketType.price.toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </div>
                )}

                {scanResult.data.seat && (
                  <div className="flex items-center gap-2.5 border-t border-white/10 pt-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-zinc-400 font-medium">Vị trí chỗ ngồi</p>
                      <p className="text-white font-bold text-sm">
                        Ghế {scanResult.data.seat.seatLabel} ({scanResult.data.seat.seatNumber})
                      </p>
                    </div>
                  </div>
                )}

                {scanResult.action === "ALREADY_CHECKED_IN" && scanResult.data.checkedInAt && (
                  <div className="flex items-center gap-2.5 border-t border-white/10 pt-2 text-amber-300">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-amber-400/80 font-medium">Thời điểm đã check-in trước đó</p>
                      <p className="font-bold text-sm">
                        {format(new Date(scanResult.data.checkedInAt), "HH:mm:ss - dd/MM/yyyy", { locale: vi })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACTION BUTTON: SCAN NEXT TICKET */}
            <div className="w-full pt-2">
              <button
                onClick={handleResumeScan}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-base shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <span>Quét Vé Tiếp Theo</span>
                <CornerDownLeft className="w-5 h-5" />
              </button>
              <p className="text-[11px] text-zinc-400 mt-2 font-medium">
                (Nhấn nút hoặc phím Enter / Space để tiếp tục quét)
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: calc(100% - 2px); }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
