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
  ChevronDown, ChevronUp, Loader2, Volume2, VolumeX, RefreshCw, X
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────────────── */
type ScanAction = "SUCCESS" | "ALREADY_CHECKED_IN" | "WRONG_EVENT" | "INVALID" | "CANCELLED" | null;

interface ScanResult {
  success: boolean;
  action: ScanAction;
  message: string;
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

/* ─────────────────────────── Audio ────────────────────────────────── */
function playBeep(type: "success" | "warning" | "error", muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "success") {
      osc.frequency.value = 900; osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === "warning") {
      osc.frequency.value = 520; osc.type = "triangle";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScannedCode = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ─── Event detail ───
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
      const result: ScanResult = res.data;
      setScanResult(result);
      qc.invalidateQueries({ queryKey: ["staff-event-detail", eventId] });

      // Add to recent scans
      const newScan: RecentScan = {
        code,
        action: result.action,
        time: new Date(),
        buyerName: result.data?.buyer?.name || result.data?.buyer?.email,
        ticketType: result.data?.ticketType?.name,
      };
      setRecentScans((prev) => [newScan, ...prev].slice(0, 30));

      // Play sound
      if (result.action === "SUCCESS") playBeep("success", isMuted);
      else if (result.action === "ALREADY_CHECKED_IN") playBeep("warning", isMuted);
      else playBeep("error", isMuted);

      // Auto-clear result after 4s
      clearTimeout(resultTimer.current);
      resultTimer.current = setTimeout(() => setScanResult(null), 4000);
    },
    onError: (err: any) => {
      const apiResult: ScanResult = {
        success: false,
        action: err?.response?.data?.action || "INVALID",
        message: err?.response?.data?.message || "Lỗi kết nối. Thử lại.",
        data: err?.response?.data?.data,
      };
      setScanResult(apiResult);
      playBeep(apiResult.action === "ALREADY_CHECKED_IN" ? "warning" : "error", isMuted);
      clearTimeout(resultTimer.current);
      resultTimer.current = setTimeout(() => setScanResult(null), 4000);
    },
  });

  const handleScan = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Debounce: ignore same code within 2 seconds
    const now = Date.now();
    if (trimmed === lastScannedCode.current && now - lastScannedTime.current < 2000) return;
    lastScannedCode.current = trimmed;
    lastScannedTime.current = now;

    checkinMutation.mutate(trimmed);
  }, [checkinMutation]);

  // ─── Camera Scanner ───
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

  // ─── Manual mode ───
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScan(manualCode);
    setManualCode("");
  };

  // Auto-focus input on manual mode
  useEffect(() => {
    if (mode === "manual") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mode]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      clearTimeout(resultTimer.current);
    };
  }, []);

  /* ─── Result overlay config ─── */
  const resultConfig: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
    SUCCESS: {
      bg: "bg-emerald-500/10", border: "border-emerald-500/40",
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-400" />, label: "CHECK-IN THÀNH CÔNG"
    },
    ALREADY_CHECKED_IN: {
      bg: "bg-amber-500/10", border: "border-amber-500/40",
      icon: <AlertTriangle className="w-10 h-10 text-amber-400" />, label: "ĐÃ CHECK-IN TRƯỚC ĐÓ"
    },
    WRONG_EVENT: {
      bg: "bg-orange-500/10", border: "border-orange-500/40",
      icon: <XCircle className="w-10 h-10 text-orange-400" />, label: "SAI SỰ KIỆN"
    },
    INVALID: {
      bg: "bg-red-500/10", border: "border-red-500/40",
      icon: <XCircle className="w-10 h-10 text-red-400" />, label: "VÉ KHÔNG HỢP LỆ"
    },
    CANCELLED: {
      bg: "bg-red-500/10", border: "border-red-500/40",
      icon: <XCircle className="w-10 h-10 text-red-400" />, label: "VÉ ĐÃ HỦY"
    },
  };

  const rc = scanResult?.action ? resultConfig[scanResult.action] : null;

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-[#060610] flex flex-col select-none">
      {/* Header */}
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

      {/* Mode switcher */}
      <div className="max-w-lg mx-auto w-full px-4 pt-4">
        <div className="flex gap-2 p-1 bg-white/[0.05] rounded-xl border border-white/10">
          <button
            onClick={() => setMode("camera")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === "camera"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Camera className="w-4 h-4" /> Camera QR
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === "manual"
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Keyboard className="w-4 h-4" /> Nhập mã
          </button>
        </div>
      </div>

      {/* Main scanner area */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        {mode === "camera" ? (
          <div className="space-y-4">
            {/* QR reader container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square">
              <div id="qr-reader" className="w-full h-full" />

              {/* Scanner overlay frame */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-52 h-52">
                    {/* Corners */}
                    {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
                      <div
                        key={pos}
                        className={`absolute w-8 h-8 border-4 border-violet-400
                          ${pos === "top-left" ? "top-0 left-0 border-r-0 border-b-0 rounded-tl-lg" : ""}
                          ${pos === "top-right" ? "top-0 right-0 border-l-0 border-b-0 rounded-tr-lg" : ""}
                          ${pos === "bottom-left" ? "bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg" : ""}
                          ${pos === "bottom-right" ? "bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg" : ""}
                        `}
                      />
                    ))}
                    {/* Scan line animation */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-[scan_2s_linear_infinite]" />
                  </div>
                </div>
              )}

              {/* Camera loading state */}
              {!isCameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                  <p className="text-zinc-400 text-sm">Đang khởi động camera...</p>
                </div>
              )}

              {/* Camera error state */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900 p-6 text-center">
                  <CameraOff className="w-12 h-12 text-red-400" />
                  <p className="text-zinc-300 text-sm">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Thử lại
                  </button>
                </div>
              )}

              {/* Processing overlay */}
              {checkinMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                    <p className="text-white text-xs">Đang xử lý...</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-zinc-500 text-xs">
              Hướng camera vào mã QR trên vé để quét tự động
            </p>
          </div>
        ) : (
          /* Manual input mode */
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-5">
              <div className="text-center">
                <ScanLine className="w-10 h-10 text-violet-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Nhập mã vé thủ công</p>
                <p className="text-zinc-500 text-xs mt-1">Dùng khi không quét được QR code</p>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  ref={inputRef}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Nhập mã vé hoặc ID..."
                  className="w-full px-4 py-4 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
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

        {/* ── RESULT CARD ── */}
        {scanResult && rc && (
          <div className={`mt-4 rounded-2xl border p-4 ${rc.bg} ${rc.border} transition-all duration-300 animate-in slide-in-from-bottom-4`}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{rc.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-black text-sm tracking-wider ${
                  scanResult.action === "SUCCESS" ? "text-emerald-400" :
                  scanResult.action === "ALREADY_CHECKED_IN" ? "text-amber-400" :
                  "text-red-400"
                }`}>
                  {rc.label}
                </p>
                <p className="text-zinc-300 text-sm mt-1">{scanResult.message}</p>

                {/* Buyer info on success or already checked in */}
                {scanResult.data?.buyer && (
                  <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="text-white font-medium truncate">
                        {scanResult.data.buyer.name || scanResult.data.buyer.email}
                      </span>
                    </div>
                    {scanResult.data.ticketType && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ticket className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300">{scanResult.data.ticketType.name}</span>
                      </div>
                    )}
                    {scanResult.data.seat && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300">Ghế {scanResult.data.seat.seatLabel}</span>
                      </div>
                    )}
                    {scanResult.action === "ALREADY_CHECKED_IN" && scanResult.data.checkedInAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="text-zinc-400">
                          Đã check-in: {format(new Date(scanResult.data.checkedInAt), "HH:mm dd/MM", { locale: vi })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setScanResult(null)}
                className="shrink-0 w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Recent Scans ── */}
        {recentScans.length > 0 && (
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-300 text-sm font-medium">Vừa quét ({recentScans.length})</span>
              </div>
              {showRecent ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {showRecent && (
              <div className="divide-y divide-white/[0.06] max-h-60 overflow-y-auto">
                {recentScans.map((scan, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      scan.action === "SUCCESS" ? "bg-emerald-400" :
                      scan.action === "ALREADY_CHECKED_IN" ? "bg-amber-400" : "bg-red-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 font-mono truncate">{scan.code}</p>
                      {scan.buyerName && (
                        <p className="text-xs text-zinc-500 truncate">{scan.buyerName}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {format(scan.time, "HH:mm:ss")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scan line animation CSS */}
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
