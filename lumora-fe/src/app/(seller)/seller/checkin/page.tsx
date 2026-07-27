"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  QrCode, Search, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Camera, CameraOff, Volume2, VolumeX, Sparkles, Ticket
} from "lucide-react";

export default function SellerCheckinPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  // Camera scanner states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const scannerRef = useRef<any>(null);
  const lastScannedCode = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);

  // Sound effect on checkin
  const playBeep = (success: boolean) => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6 note
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      }
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext might be restricted until user interaction
    }
  };

  // Perform check-in API call
  const performCheckin = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setLoading(true);
    setCheckinResult(null);

    try {
      const res = await api.patch(`/seller/orders/items/${encodeURIComponent(cleanCode)}/checkin`);
      if (res.data.success) {
        playBeep(true);
        toast.success("Check-in hợp lệ!");
        const timeStr = new Date().toLocaleTimeString("vi-VN");
        setCheckinResult({
          status: "SUCCESS",
          message: "Check-in thành công!",
          ticketCode: cleanCode,
          time: timeStr,
        });
        setRecentCheckins(prev => [
          { ticketCode: cleanCode, time: timeStr, status: "SUCCESS" },
          ...prev.slice(0, 14)
        ]);
        setTicketCode("");
      }
    } catch (err: any) {
      playBeep(false);
      const msg = err?.response?.data?.error?.message || "Mã vé không hợp lệ hoặc đã được check-in trước đó";
      toast.error(msg);
      const timeStr = new Date().toLocaleTimeString("vi-VN");
      setCheckinResult({
        status: "FAILED",
        message: msg,
        ticketCode: cleanCode,
        time: timeStr,
      });
      setRecentCheckins(prev => [
        { ticketCode: cleanCode, time: timeStr, status: "FAILED" },
        ...prev.slice(0, 14)
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Manual Submit
  const handleManualCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) {
      toast.error("Vui lòng nhập mã vé");
      return;
    }
    performCheckin(ticketCode);
  };

  // Camera scanner effect
  useEffect(() => {
    let html5Qrcode: any = null;

    if (isCameraActive) {
      setCameraError(null);
      import("html5-qrcode").then(({ Html5Qrcode }) => {
        html5Qrcode = new Html5Qrcode("reader");
        scannerRef.current = html5Qrcode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5Qrcode.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            const now = Date.now();
            // Debounce scanning same code within 3 seconds
            if (lastScannedCode.current === decodedText && now - lastScannedTime.current < 3000) {
              return;
            }
            lastScannedCode.current = decodedText;
            lastScannedTime.current = now;
            performCheckin(decodedText);
          },
          () => {
            // Ignore scan errors (frame did not contain QR)
          }
        ).catch((err: any) => {
          console.error("Camera access error:", err);
          setCameraError("Không thể mở webcam/camera. Vui lòng cấp quyền truy cập camera trên trình duyệt.");
          setIsCameraActive(false);
        });
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current.clear();
        });
        scannerRef.current = null;
      }
    };
  }, [isCameraActive]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <QrCode className="h-7 w-7 text-primary" /> Check-in Scanner
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quét mã QR bằng Camera hoặc nhập mã vé thủ công để kiểm tra tính hợp lệ khi vào cổng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-xl gap-2 text-xs font-semibold"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
            {isMuted ? "Tắt âm" : "Bật âm thanh"}
          </Button>
          <Button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`rounded-xl gap-2 font-bold text-sm shadow-md transition-all ${
              isCameraActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isCameraActive ? (
              <><CameraOff className="h-4 w-4" /> Tắt Camera Scanner</>
            ) : (
              <><Camera className="h-4 w-4" /> Bật Camera Scanner</>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Scanner & Form Section (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* WebCam Scanner Card */}
          {isCameraActive && (
            <Card className="rounded-3xl border-2 border-primary/40 shadow-xl overflow-hidden bg-card">
              <CardHeader className="pb-2 border-b border-border/40 bg-primary/5">
                <CardTitle className="text-sm font-extrabold flex items-center justify-between text-primary">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" /> Camera Scanner Live
                  </span>
                  <Badge className="bg-emerald-500 text-white text-[10px] uppercase font-bold animate-pulse">
                    Đang quét...
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div id="reader" className="w-full max-w-sm rounded-2xl overflow-hidden border border-border"></div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Căn chỉnh mã QR vé trên điện thoại của khách vào giữa khung hình scanner
                </p>
              </CardContent>
            </Card>
          )}

          {cameraError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Manual Input Card */}
          <Card className="rounded-3xl border border-border/60 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> Nhập mã vé / ID thủ công
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleManualCheckin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mã vé (Ticket Code)</label>
                  <div className="relative">
                    <Input
                      placeholder="VD: TCK-88X9A21 hoặc UUID"
                      value={ticketCode}
                      onChange={e => setTicketCode(e.target.value)}
                      className="h-12 text-lg font-mono uppercase tracking-wider pl-4 rounded-xl"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || !ticketCode.trim()}
                  className="w-full h-12 rounded-xl font-bold text-base gap-2 bg-primary hover:bg-primary/90 shadow-md"
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Xác nhận Check-in ngay"}
                </Button>
              </form>

              {/* Status Banner */}
              {checkinResult && (
                <div className={`p-5 rounded-2xl border-2 flex items-start gap-4 transition-all animate-in fade-in ${
                  checkinResult.status === "SUCCESS"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200"
                    : "bg-red-50 border-red-300 text-red-950 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200"
                }`}>
                  {checkinResult.status === "SUCCESS" ? (
                    <div className="p-2 bg-emerald-500 text-white rounded-full shrink-0">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-500 text-white rounded-full shrink-0">
                      <XCircle className="h-7 w-7" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="font-black text-lg">{checkinResult.message}</p>
                    <p className="text-sm font-mono font-semibold">Mã vé: {checkinResult.ticketCode}</p>
                    <p className="text-xs opacity-75">Thời gian: {checkinResult.time}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History Section (Right 1 col) */}
        <div className="lg:col-span-1">
          <Card className="rounded-3xl border border-border/60 shadow-sm sticky top-6">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-extrabold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" /> Lịch sử quét vé
                </span>
                <Badge variant="outline" className="text-[11px] font-bold">
                  {recentCheckins.length} lượt
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {recentCheckins.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
                  <QrCode className="h-10 w-10 mx-auto opacity-30" />
                  <p>Chưa có vé nào được quét trong phiên làm việc này</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {recentCheckins.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/40 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-mono font-bold uppercase text-foreground">{item.ticketCode}</p>
                        <p className="text-[10px] text-muted-foreground">{item.time}</p>
                      </div>
                      <Badge className={item.status === "SUCCESS" ? "bg-emerald-500" : "bg-red-500"}>
                        {item.status === "SUCCESS" ? "Thành công" : "Lỗi"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
