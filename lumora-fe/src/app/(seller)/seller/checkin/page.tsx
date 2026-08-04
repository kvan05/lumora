"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Barcode, Search, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Camera, CameraOff, Volume2, VolumeX, Sparkles, Ticket, ScanLine, Eye
} from "lucide-react";
import { BarcodeImage, ETicketModal } from "@/components/ticket/EventTicket";

export default function SellerCheckinPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Camera scanner states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
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
      osc.frequency.value = success ? 880 : 280;
      osc.type = success ? "sine" : "square";
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext might be restricted until user interaction
    }
  };

  // Perform check-in API call
  const performCheckin = useCallback(async (code: string) => {
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
  }, [isMuted]);

  // Manual Submit
  const handleManualCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) {
      toast.error("Vui lòng nhập mã vé");
      return;
    }
    performCheckin(ticketCode);
  };

  // Barcode camera scanner using @zxing/browser
  useEffect(() => {
    let active = true;

    if (isCameraActive) {
      setCameraError(null);
      setScannerReady(false);

      import("@zxing/browser").then(({ BrowserMultiFormatReader }) => {
        if (!active || !videoRef.current) return;

        const codeReader = new BrowserMultiFormatReader();
        scannerRef.current = codeReader;

        codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText();
              const now = Date.now();
              if (lastScannedCode.current === text && now - lastScannedTime.current < 3000) {
                return;
              }
              lastScannedCode.current = text;
              lastScannedTime.current = now;
              performCheckin(text);
            }
            // Ignore NotFoundException (frame with no barcode)
          }
        ).then(() => {
          if (active) setScannerReady(true);
        }).catch((err: any) => {
          if (!active) return;
          console.error("Camera barcode scanner error:", err);
          setCameraError("Không thể mở camera. Vui lòng cấp quyền truy cập camera trên trình duyệt.");
          setIsCameraActive(false);
        });
      });
    }

    return () => {
      active = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.reset();
        } catch {}
        scannerRef.current = null;
      }
      setScannerReady(false);
    };
  }, [isCameraActive, performCheckin]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Barcode className="h-7 w-7 text-primary" /> Barcode Soát Vé
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quét mã vạch bằng Camera hoặc nhập mã vé thủ công để kiểm tra tính hợp lệ khi vào cổng
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

          {/* Camera Barcode Scanner Card */}
          {isCameraActive && (
            <Card className="rounded-3xl border-2 border-primary/40 shadow-xl overflow-hidden bg-card">
              <CardHeader className="pb-2 border-b border-border/40 bg-primary/5">
                <CardTitle className="text-sm font-extrabold flex items-center justify-between text-primary">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 animate-pulse" /> Barcode Camera Scanner Live
                  </span>
                  <Badge className={`text-white text-[10px] uppercase font-bold ${scannerReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}>
                    {scannerReady ? "Đang quét..." : "Đang khởi động..."}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center justify-center relative">
                {/* Video Feed */}
                <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-border bg-black">
                  <video
                    ref={videoRef}
                    className="w-full aspect-video object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {/* Scan line animation */}
                    <div
                      className="w-4/5 h-0.5 bg-primary/80"
                      style={{ animation: "scan 2s linear infinite", boxShadow: "0 0 8px 2px hsl(var(--primary) / 0.6)" }}
                    />
                    {/* Corner brackets */}
                    <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center flex items-center gap-1">
                  <ScanLine className="h-3.5 w-3.5" />
                  Căn chỉnh mã vạch vé vào giữa khung hình để quét tự động
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
                <Search className="h-4 w-4 text-primary" /> Nhập mã vé / mã vạch thủ công
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleManualCheckin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mã vé (Barcode / Ticket Code)</label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="VD: TCK-88X9A21 hoặc UUID"
                      value={ticketCode}
                      onChange={e => setTicketCode(e.target.value)}
                      className="h-12 text-lg font-mono uppercase tracking-wider pl-10 rounded-xl"
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || !ticketCode.trim()}
                  className="w-full h-12 rounded-xl font-bold text-base gap-2 bg-primary hover:bg-primary/90 shadow-md"
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : (
                    <><Barcode className="h-5 w-5" /> Xác nhận Check-in ngay</>
                  )}
                </Button>
              </form>

              {/* Status Banner */}
              {checkinResult && (
                <div className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-in fade-in ${
                  checkinResult.status === "SUCCESS"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200"
                    : "bg-red-50 border-red-300 text-red-950 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200"
                }`}>
                  <div className="flex items-start gap-4">
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
                      <p className="text-sm font-mono font-bold">Mã vé: {checkinResult.ticketCode}</p>
                      <p className="text-xs opacity-75">Thời gian: {checkinResult.time}</p>
                    </div>
                  </div>

                  {/* Render Barcode SVG preview */}
                  <div className="bg-white p-2.5 rounded-xl border border-border/60 shadow-xs flex flex-col items-center shrink-0">
                    <BarcodeImage text={checkinResult.ticketCode} height={40} width={1.4} fontSize={10} />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 h-6 text-[10px] font-bold text-primary hover:bg-primary/5 px-2"
                      onClick={() => {
                        setSelectedTicket({
                          ticketCode: checkinResult.ticketCode,
                          eventTitle: "Sự kiện Soát Vé",
                          category: "Sự kiện",
                          ticketType: "Vé Khách Hàng",
                          startDate: new Date(),
                          venue: "Địa điểm Soát vé",
                          city: "Việt Nam",
                          status: checkinResult.status === "SUCCESS" ? "CONFIRMED" : "FAILED",
                          isCheckedIn: checkinResult.status === "SUCCESS",
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" /> Xem Phôi Vé Full
                    </Button>
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
                  <Barcode className="h-10 w-10 mx-auto opacity-30" />
                  <p>Chưa có vé nào được quét trong phiên làm việc này</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {recentCheckins.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/40 text-xs hover:border-primary/40 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedTicket({
                          ticketCode: item.ticketCode,
                          eventTitle: "Sự kiện Lumora",
                          category: "Sự kiện",
                          ticketType: "Vé Khách Hàng",
                          startDate: new Date(),
                          venue: "Địa điểm Soát vé",
                          city: "Việt Nam",
                          status: item.status === "SUCCESS" ? "CONFIRMED" : "FAILED",
                          isCheckedIn: item.status === "SUCCESS",
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="space-y-0.5">
                        <p className="font-mono font-bold uppercase text-primary flex items-center gap-1">
                          <Barcode className="h-3 w-3" /> {item.ticketCode}
                        </p>
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

      <ETicketModal open={isModalOpen} onOpenChange={setIsModalOpen} ticket={selectedTicket} />
    </div>
  );
}
