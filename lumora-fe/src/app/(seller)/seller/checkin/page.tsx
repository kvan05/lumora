"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Barcode, Search, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Camera, CameraOff, Volume2, VolumeX, Sparkles, Ticket, ScanLine, Eye,
  UserCheck, Users, Clock, Filter, ShieldCheck, AlertTriangle, ChevronRight
} from "lucide-react";
import { BarcodeImage, ETicketModal } from "@/components/ticket/EventTicket";

export default function SellerCheckinPage() {
  const queryClient = useQueryClient();
  const [ticketCode, setTicketCode] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  // Attendee Search & Status Filters
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeStatus, setAttendeeStatus] = useState<"ALL" | "CHECKED_IN" | "NOT_CHECKED_IN">("ALL");

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
  const playBeep = (type: "success" | "warning" | "error") => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "warning") {
        osc.frequency.value = 520;
        osc.type = "triangle";
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.value = 240;
        osc.type = "square";
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext restriction ignored
    }
  };

  // 1. Fetch Seller Events for Event Selector
  const { data: eventsData } = useQuery({
    queryKey: ["seller-events-checkin-filter"],
    queryFn: async () => {
      const res = await api.get("/seller/events");
      return res.data.data;
    },
  });

  const sellerEvents = eventsData?.events || eventsData || [];

  // 2. Fetch Checkin Real-Time Statistics
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ["seller-checkin-stats", selectedEventId],
    queryFn: async () => {
      const res = await api.get("/seller/checkin/stats", {
        params: { eventId: selectedEventId || undefined },
      });
      return res.data.data;
    },
  });

  const stats = statsData || { totalTickets: 0, checkedInCount: 0, uncheckedCount: 0, checkinRate: 0 };

  // 3. Fetch Attendee Tickets List
  const { data: ticketsData, isLoading: isTicketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ["seller-checkin-tickets", selectedEventId, attendeeSearch, attendeeStatus],
    queryFn: async () => {
      const res = await api.get("/seller/checkin/tickets", {
        params: {
          eventId: selectedEventId || undefined,
          search: attendeeSearch || undefined,
          isCheckedIn: attendeeStatus === "ALL" ? undefined : attendeeStatus === "CHECKED_IN" ? "true" : "false",
        },
      });
      return res.data.data;
    },
  });

  const attendeeTickets = Array.isArray(ticketsData) ? ticketsData : [];

  // Perform Check-in API Call
  const performCheckin = useCallback(async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    try {
      const res = await api.patch(`/seller/orders/items/${encodeURIComponent(cleanCode)}/checkin`);
      const data = res.data;
      const timeStr = new Date().toLocaleTimeString("vi-VN");

      if (data.alreadyCheckedIn) {
        playBeep("warning");
        toast.warning("Vé này ĐÃ ĐƯỢC CHECK-IN trước đó!", {
          description: `${data.data?.buyerName || "Khách"} · ${data.data?.eventTitle || ""}`,
        });

        setCheckinResult({
          status: "ALREADY_CHECKED_IN",
          message: data.message || "Vé đã được Check-in trước đó!",
          ticketCode: cleanCode,
          time: timeStr,
          data: data.data,
        });

        setRecentCheckins((prev) => [
          { ticketCode: cleanCode, time: timeStr, status: "ALREADY_CHECKED_IN", data: data.data },
          ...prev.slice(0, 14),
        ]);
      } else {
        playBeep("success");
        toast.success("Check-in vé hợp lệ!", {
          description: `Khán giả: ${data.data?.buyerName || "Khách"} · Loại vé: ${data.data?.ticketType || ""}`,
        });

        setCheckinResult({
          status: "SUCCESS",
          message: "Check-in thành công!",
          ticketCode: cleanCode,
          time: timeStr,
          data: data.data,
        });

        setRecentCheckins((prev) => [
          { ticketCode: cleanCode, time: timeStr, status: "SUCCESS", data: data.data },
          ...prev.slice(0, 14),
        ]);
        setTicketCode("");
      }

      // Refresh Stats and Ticket list
      queryClient.invalidateQueries({ queryKey: ["seller-checkin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["seller-checkin-tickets"] });
    } catch (err: any) {
      playBeep("error");
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || "Mã vé không hợp lệ hoặc không tìm thấy";
      toast.error(msg);
      const timeStr = new Date().toLocaleTimeString("vi-VN");
      setCheckinResult({
        status: "FAILED",
        message: msg,
        ticketCode: cleanCode,
        time: timeStr,
      });

      setRecentCheckins((prev) => [
        { ticketCode: cleanCode, time: timeStr, status: "FAILED" },
        ...prev.slice(0, 14),
      ]);
    }
  }, [isMuted, queryClient]);

  // Manual Submit
  const handleManualCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) {
      toast.error("Vui lòng nhập mã vé Barcode");
      return;
    }
    performCheckin(ticketCode);
  };

  // Barcode Camera Scanner using @zxing/browser
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
          (result) => {
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
          }
        ).then(() => {
          if (active) setScannerReady(true);
        }).catch((err: any) => {
          if (!active) return;
          console.error("Camera scanner error:", err);
          setCameraError("Không thể mở Camera. Vui lòng cấp quyền truy cập Camera trên trình duyệt.");
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

  const handleOpenTicketModal = (item: any) => {
    setSelectedTicket({
      ticketCode: item.ticketCode || item.id,
      eventTitle: item.eventTitle || "Sự kiện Lumora",
      bannerUrl: item.bannerUrl,
      category: item.category || "Sự kiện",
      ticketType: item.ticketType || "Vé Khách Hàng",
      startDate: item.startDate ? new Date(item.startDate) : new Date(),
      venue: item.venue || "Địa điểm Soát vé",
      city: item.city || "Việt Nam",
      seatInfo: item.seatLabel ? `Ghế ${item.seatLabel}` : null,
      status: "CONFIRMED",
      isCheckedIn: item.isCheckedIn,
      holderName: item.buyerName,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-[#93C453]/10 text-[#4A7C59] border-[#93C453]/20 font-bold uppercase text-[10px] tracking-wider">
              CỔNG SOÁT VÉ BARCODE REALTIME
            </Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Barcode className="h-8 w-8 text-[#93C453]" /> Soát Vé & Check-in Sự Kiện
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quét mã vạch Barcode bằng Camera hoặc kiểm soát khán giả tại cổng bằng danh sách tra cứu 1-Click.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Event selector */}
          <Select
            value={selectedEventId}
            onValueChange={(val) => setSelectedEventId(val === "ALL" ? "" : val)}
          >
            <SelectTrigger className="rounded-2xl h-10 text-xs font-semibold w-56 bg-background">
              <SelectValue placeholder="Tất cả sự kiện của tôi" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="ALL">Tất cả sự kiện của tôi</SelectItem>
              {Array.isArray(sellerEvents) &&
                sellerEvents.map((ev: any) => (
                  <SelectItem key={ev.id} value={ev.id}>
                    {ev.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-2xl h-10 gap-2 text-xs font-bold border-border"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
            {isMuted ? "Tắt âm" : "Âm thanh"}
          </Button>

          <Button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`rounded-2xl h-10 gap-2 font-bold text-xs shadow-sm transition-all ${
              isCameraActive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#93C453] hover:bg-[#82b342] text-white"
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

      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-border/60 bg-card shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Tổng Vé Đã Xuất</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{stats.totalTickets}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">vé thành công</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold">
              <Ticket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đã Check-in</p>
              <h3 className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{stats.checkedInCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">lượt vào cổng</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Chưa Check-in</p>
              <h3 className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">{stats.uncheckedCount}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">khán giả chưa đến</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-[#93C453]/30 bg-[#93C453]/5 shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-[#4A7C59] dark:text-[#93C453] uppercase tracking-wider">Tỷ Lệ Tiến Độ</p>
              <h3 className="text-2xl font-black mt-1 text-[#4A7C59] dark:text-[#93C453]">{stats.checkinRate}%</h3>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-[#93C453] transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.checkinRate)}%` }}
                />
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#93C453]/20 text-[#4A7C59] flex items-center justify-center shrink-0">
              <ScanLine className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkin Main Tabs */}
      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 rounded-2xl bg-muted/60 p-1 mb-6">
          <TabsTrigger value="scanner" className="rounded-xl text-xs font-bold px-5">
            <Barcode className="h-4 w-4 mr-2 text-[#93C453]" /> Quét Mã Vạch Barcode
          </TabsTrigger>
          <TabsTrigger value="attendees" className="rounded-xl text-xs font-bold px-5">
            <Users className="h-4 w-4 mr-2 text-blue-500" /> Tra Cứu Khán Giả Tại Cổng ({stats.totalTickets})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Scanner */}
        <TabsContent value="scanner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Scanner Form & Result */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Camera Scanner Box */}
              {isCameraActive && (
                <Card className="rounded-3xl border-2 border-[#93C453] shadow-xl overflow-hidden bg-card">
                  <CardHeader className="pb-2 border-b border-border/40 bg-[#93C453]/10">
                    <CardTitle className="text-sm font-extrabold flex items-center justify-between text-[#4A7C59]">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 animate-pulse" /> Barcode Camera Scanner Live
                      </span>
                      <Badge className={`text-white text-[10px] uppercase font-bold ${scannerReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}>
                        {scannerReady ? "Đang quét mã..." : "Đang khởi tạo camera..."}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col items-center justify-center relative">
                    <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-border bg-black">
                      <video
                        ref={videoRef}
                        className="w-full aspect-video object-cover"
                        autoPlay
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div
                          className="w-4/5 h-0.5 bg-[#93C453]"
                          style={{ animation: "scan 2s linear infinite", boxShadow: "0 0 10px 2px #93C453" }}
                        />
                        <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-[#93C453] rounded-tl-lg" />
                        <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-[#93C453] rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-[#93C453] rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-[#93C453] rounded-br-lg" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center flex items-center gap-1">
                      <ScanLine className="h-3.5 w-3.5" />
                      Đưa mã vạch Barcode trên phôi vé điện tử vào khung hình để tự động nhận diện
                    </p>
                  </CardContent>
                </Card>
              )}

              {cameraError && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Manual Code Input Form */}
              <Card className="rounded-3xl border border-border/70 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#93C453]" /> Nhập mã vé Barcode thủ công
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleManualCheckin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mã vé (Barcode CODE128 / Ticket Code)</label>
                      <div className="relative">
                        <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Nhập mã vé, ví dụ: TCK-88X9A21 hoặc dán mã tại đây..."
                          value={ticketCode}
                          onChange={(e) => setTicketCode(e.target.value)}
                          className="h-12 text-lg font-mono uppercase tracking-wider pl-11 rounded-2xl bg-background"
                          autoFocus
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={!ticketCode.trim()}
                      className="w-full h-12 rounded-2xl font-bold text-sm gap-2 bg-[#93C453] hover:bg-[#82b342] text-white shadow-sm"
                    >
                      <Barcode className="h-5 w-5" /> Xác Nhận Soát Vé Ngay
                    </Button>
                  </form>

                  {/* Dynamic Checkin Result Banner */}
                  {checkinResult && (
                    <div className={`p-5 rounded-2xl border-2 space-y-4 transition-all animate-in fade-in ${
                      checkinResult.status === "SUCCESS"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                        : checkinResult.status === "ALREADY_CHECKED_IN"
                        ? "bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200"
                        : "bg-red-50 border-red-300 text-red-950 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {checkinResult.status === "SUCCESS" ? (
                            <div className="p-2 bg-emerald-500 text-white rounded-full shrink-0">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                          ) : checkinResult.status === "ALREADY_CHECKED_IN" ? (
                            <div className="p-2 bg-amber-500 text-white rounded-full shrink-0">
                              <AlertTriangle className="h-6 w-6" />
                            </div>
                          ) : (
                            <div className="p-2 bg-red-500 text-white rounded-full shrink-0">
                              <XCircle className="h-6 w-6" />
                            </div>
                          )}

                          <div className="space-y-1">
                            <p className="font-black text-lg">{checkinResult.message}</p>
                            <p className="text-xs font-mono font-bold">Mã vạch: {checkinResult.ticketCode}</p>

                            {checkinResult.data && (
                              <div className="text-xs pt-1 space-y-0.5 opacity-90">
                                <p>Khán giả: <strong>{checkinResult.data.buyerName}</strong> ({checkinResult.data.buyerEmail})</p>
                                <p>Sự kiện: <strong>{checkinResult.data.eventTitle}</strong></p>
                                <p>Loại vé: <strong>{checkinResult.data.ticketType}</strong> {checkinResult.data.seatLabel ? `(Ghế: ${checkinResult.data.seatLabel})` : ""}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {checkinResult.data && (
                          <div className="bg-white p-3 rounded-2xl border border-border/70 shadow-xs flex flex-col items-center shrink-0 self-start sm:self-auto">
                            <BarcodeImage text={checkinResult.ticketCode} height={40} width={1.4} fontSize={10} />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-1 h-7 text-[10px] font-bold text-[#93C453] hover:bg-[#93C453]/10 px-2 rounded-xl"
                              onClick={() => handleOpenTicketModal(checkinResult.data)}
                            >
                              <Eye className="h-3 w-3 mr-1" /> Xem Phôi Vé Full
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Recent Scans Log */}
            <div className="lg:col-span-1">
              <Card className="rounded-3xl border border-border/70 shadow-xs sticky top-6">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-extrabold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-[#93C453]" /> Nhật ký quét phiên này
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {recentCheckins.length} lượt
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {recentCheckins.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
                      <Barcode className="h-10 w-10 mx-auto opacity-30" />
                      <p>Chưa có lượt quét nào trong phiên làm việc này</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                      {recentCheckins.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => item.data && handleOpenTicketModal(item.data)}
                          className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs hover:border-[#93C453]/60 cursor-pointer transition-colors"
                        >
                          <div className="space-y-0.5">
                            <p className="font-mono font-bold uppercase text-foreground flex items-center gap-1 text-xs">
                              <Barcode className="h-3.5 w-3.5 text-muted-foreground" /> {item.ticketCode}
                            </p>
                            {item.data?.buyerName && (
                              <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                {item.data.buyerName}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">{item.time}</p>
                          </div>

                          <Badge
                            className={`text-[9px] font-bold ${
                              item.status === "SUCCESS"
                                ? "bg-emerald-500 text-white"
                                : item.status === "ALREADY_CHECKED_IN"
                                ? "bg-amber-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {item.status === "SUCCESS" ? "Thành công" : item.status === "ALREADY_CHECKED_IN" ? "Đã Check-in" : "Lỗi"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Attendee Gate Lookup List */}
        <TabsContent value="attendees" className="space-y-4">
          <Card className="rounded-3xl border border-border shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-border/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" /> Tra Cứu Khán Giả & Check-in Tại Cổng
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Tìm kiếm khán giả theo tên, email, số điện thoại hoặc mã vé để hỗ trợ soát vé 1-Click khi không mang mã vạch.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl border border-border/60 text-xs self-start sm:self-auto">
                  <Button
                    variant={attendeeStatus === "ALL" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-xl text-xs font-bold"
                    onClick={() => setAttendeeStatus("ALL")}
                  >
                    Tất cả ({attendeeTickets.length})
                  </Button>
                  <Button
                    variant={attendeeStatus === "CHECKED_IN" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    onClick={() => setAttendeeStatus("CHECKED_IN")}
                  >
                    Đã Check-in
                  </Button>
                  <Button
                    variant={attendeeStatus === "NOT_CHECKED_IN" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400"
                    onClick={() => setAttendeeStatus("NOT_CHECKED_IN")}
                  >
                    Chưa Check-in
                  </Button>
                </div>
              </div>

              {/* Attendee Search Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên khán giả, email, số điện thoại hoặc mã vé..."
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  className="pl-10 rounded-2xl h-10 text-xs bg-background"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {isTicketsLoading ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center space-y-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-[#93C453]" />
                  <p className="text-sm font-medium">Đang tải danh sách vé sự kiện...</p>
                </div>
              ) : attendeeTickets.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground space-y-2">
                  <Ticket className="h-10 w-10 mx-auto opacity-30" />
                  <p className="font-bold text-base text-foreground">Không tìm thấy vé nào</p>
                  <p className="text-xs max-w-sm mx-auto">
                    Không có vé nào phù hợp với bộ lọc từ khóa hoặc trạng thái của bạn.
                  </p>
                </div>
              ) : (
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="border-b border-border/80 bg-muted/40 font-black uppercase text-muted-foreground">
                      <TableHead className="p-4 pl-6">Mã Vé Barcode</TableHead>
                      <TableHead className="p-4">Khán Giả (Buyer)</TableHead>
                      <TableHead className="p-4">Sự Kiện & Loại Vé</TableHead>
                      <TableHead className="p-4">Vị Trí Ghế</TableHead>
                      <TableHead className="p-4">Trạng Thái Check-in</TableHead>
                      <TableHead className="p-4 pr-6 text-right">Thao Tác Tại Cổng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60">
                    {attendeeTickets.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                        {/* Ticket code & Order */}
                        <TableCell className="p-4 pl-6 font-mono">
                          <p className="font-extrabold text-sm text-[#4A7C59] dark:text-[#93C453]">{t.ticketCode || t.id}</p>
                          <p className="text-[10px] text-muted-foreground">Đơn: #{t.orderNumber}</p>
                        </TableCell>

                        {/* Buyer Info */}
                        <TableCell className="p-4">
                          <p className="font-extrabold text-sm text-foreground">{t.buyerName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{t.buyerEmail}</p>
                          {t.buyerPhone && <p className="text-[10px] text-muted-foreground font-mono">{t.buyerPhone}</p>}
                        </TableCell>

                        {/* Event & Ticket Type */}
                        <TableCell className="p-4">
                          <p className="font-extrabold text-xs text-foreground line-clamp-1">{t.eventTitle}</p>
                          <Badge variant="outline" className="text-[10px] font-bold bg-muted/40 mt-0.5">
                            {t.ticketType}
                          </Badge>
                        </TableCell>

                        {/* Seat info */}
                        <TableCell className="p-4">
                          {t.seatLabel ? (
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-bold">
                              Ghế: {t.seatLabel}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Tự do</span>
                          )}
                        </TableCell>

                        {/* Checkin status */}
                        <TableCell className="p-4">
                          {t.isCheckedIn ? (
                            <div>
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Đã Check-in
                              </Badge>
                              {t.checkedInAt && (
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  {format(new Date(t.checkedInAt), "HH:mm dd/MM", { locale: vi })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px] font-bold px-2 py-0.5">
                              <Clock className="h-3 w-3 mr-1" /> Chưa Check-in
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenTicketModal(t)}
                              className="rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground h-8"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Phôi vé
                            </Button>

                            {!t.isCheckedIn && (
                              <Button
                                size="sm"
                                onClick={() => performCheckin(t.ticketCode || t.id)}
                                className="rounded-xl text-xs font-bold bg-[#93C453] hover:bg-[#82b342] text-white gap-1 h-8"
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Check-in 1-Click
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* E-Ticket Full Preview Modal */}
      <ETicketModal open={isModalOpen} onOpenChange={setIsModalOpen} ticket={selectedTicket} />
    </div>
  );
}
