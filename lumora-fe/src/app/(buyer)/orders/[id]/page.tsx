"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";
import { EventTicket, downloadTicketImage } from "@/components/ticket/EventTicket";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  ChevronLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  User,
  Download,
  RotateCcw,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const orderId = params.id as string;

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Ready when NextAuth session is authenticated OR when a local token exists (custom login flow)
  const hasLocalToken =
    typeof window !== "undefined" &&
    !!localStorage.getItem("lumora_token");
  const sessionReady =
    sessionStatus === "authenticated" || hasLocalToken;

  // Inject local token into api interceptor if NextAuth hasn't synced yet
  useEffect(() => {
    const localToken =
      typeof window !== "undefined"
        ? localStorage.getItem("lumora_token")
        : null;
    if (localToken) {
      import("@/lib/api").then(({ setMemoryAccessToken }) => {
        setMemoryAccessToken(localToken);
      });
    }
  }, []);

  const {
    data: order,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}`);
      return res.data.data;
    },
    enabled: !!orderId && sessionReady,
    retry: (failureCount, err: any) => {
      // Don't retry on 404 (order not found / not authorized)
      if (err?.response?.status === 404) return false;
      // Retry up to 3 times for other errors (network, 401 before token ready)
      return failureCount < 3;
    },
    retryDelay: 800,
    staleTime: 30_000,
  });

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) return;
    setIsSubmittingRefund(true);
    try {
      const res = await api.post(`/orders/${orderId}/refund`, { reason: refundReason });
      toast.success(res.data.message || "Yêu cầu hoàn tiền đã được gửi");
      setShowRefundModal(false);
      setRefundReason("");
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Không thể gửi yêu cầu hoàn tiền");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // Countdown timer for PENDING orders
  useEffect(() => {
    if (!order || order.status !== "PENDING") return;
    const expiresAt = new Date(order.expiresAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        router.refresh();
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [order, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ── Loading states ──────────────────────────────────────
  if (sessionStatus === "loading" || (!sessionReady && !error)) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Đang xác thực phiên đăng nhập…</p>
      </div>
    );
  }

  if (isLoading || (isFetching && !order)) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-[260px] w-full rounded-2xl" />
      </div>
    );
  }

  // ── Error / not found ──────────────────────────────────
  if (error || !order) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">
          {is404 ? "Không tìm thấy đơn hàng" : "Lỗi tải đơn hàng"}
        </h2>
        <p className="text-muted-foreground">
          {is404
            ? "Đơn hàng không tồn tại hoặc bạn không có quyền truy cập."
            : "Không thể kết nối tới server. Vui lòng thử lại."}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          {!is404 && (
            <Button variant="outline" onClick={() => refetch()} className="rounded-full gap-2">
              <RefreshCw className="h-4 w-4" /> Thử lại
            </Button>
          )}
          <Button className="rounded-full" asChild>
            <Link href="/orders">Quay lại lịch sử đặt vé</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Derived state ──────────────────────────────────────
  const eventDate = new Date(order.event.startDate);
  const isPending = order.status === "PENDING";
  const isConfirmed = order.status === "CONFIRMED" || order.status === "CHECKED_IN";
  const isCancelled = order.status === "CANCELLED";
  const isRefunded = order.status === "REFUNDED";

  const statusBadge = () => {
    switch (order.status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Chờ thanh toán</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Đã thanh toán</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Đã hủy</Badge>;
      case "REFUNDED":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Đã hoàn tiền</Badge>;
      case "CHECKED_IN":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Đã check-in</Badge>;
      default:
        return null;
    }
  };

  const handleSaveAllTickets = async () => {
    if (!order?.items || order.items.length === 0) return;
    toast.info("Đang tạo ảnh vé điện tử có mã QR...");
    for (const item of order.items) {
      const ticketTypeName = item.ticketType?.name || (item.seat ? "Vé Có Số Ghế" : "Vé Tiêu Chuẩn");
      const seatLabel = item.seat
        ? `Hàng ${item.seat.row?.rowLabel} — Ghế ${item.seat.seatLabel}${item.seat.row?.section?.name ? ` (${item.seat.row.section.name})` : ""}`
        : undefined;

      await downloadTicketImage({
        ticketCode: item.ticketCode || `PENDING-${item.id}`,
        eventTitle: order.event.title,
        bannerUrl: order.event.bannerUrl,
        category: order.event.category || "Sự kiện",
        ticketType: ticketTypeName,
        startDate: order.event.startDate,
        venue: order.event.venue,
        city: order.event.city,
        seatInfo: seatLabel,
        holderName: order.buyer?.name,
      });
    }
    toast.success("Đã tải vé điện tử có mã QR về máy thành công!");
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      {/* ── Top nav ── */}
      <div className="flex items-center justify-between gap-4 no-print">
        <Button variant="ghost" className="rounded-full pl-3" asChild>
          <Link href="/orders">
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Lịch sử vé
          </Link>
        </Button>

        {isConfirmed && (
          <div className="flex flex-wrap gap-2 justify-end">
            {order.RefundRequest ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1.5 text-xs font-bold rounded-full">
                ⏳ Đang xử lý hoàn tiền
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRefundModal(true)}
                className="rounded-full gap-1.5 text-muted-foreground hover:text-destructive border-dashed"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Yêu cầu hoàn tiền
              </Button>
            )}
            <Button
              onClick={handleSaveAllTickets}
              className="rounded-full gap-2 font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
            >
              <Download className="h-4 w-4" /> Lưu vé điện tử (Có QR) về máy
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-full gap-2 font-bold"
            >
              <Download className="h-4 w-4" /> In vé (PDF)
            </Button>
          </div>
        )}
      </div>

      {/* ── Status banners ── */}
      {isPending && (
        <div className="bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm no-print">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full text-amber-700 animate-pulse shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Đơn hàng đang chờ thanh toán</h3>
              <p className="text-sm text-amber-800/80 mt-0.5">
                Vé được giữ trong: <span className="font-mono font-black">{formatTime(timeLeft)}</span>
              </p>
            </div>
          </div>
          <Button size="sm" className="rounded-full shadow bg-amber-600 hover:bg-amber-700 text-white shrink-0" asChild>
            <Link href={`/checkout/${order.id}`}>
              Thanh toán ngay <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {isCancelled && (
        <div className="bg-rose-50 border border-rose-200 text-rose-950 rounded-2xl p-5 flex items-start gap-4 shadow-sm no-print">
          <div className="p-2.5 bg-rose-100 rounded-full text-rose-700 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Đơn đặt vé này đã bị hủy</h3>
            <p className="text-sm text-rose-800/80 mt-0.5">
              Vé đã hết thời gian giữ chỗ hoặc bị hủy thủ công. Vui lòng đặt vé mới.
            </p>
            <Button size="sm" variant="outline" className="mt-3 rounded-full border-rose-200" asChild>
              <Link href={`/events/${order.event.slug || order.event.id}`}>Đặt vé lại</Link>
            </Button>
          </div>
        </div>
      )}

      {isRefunded && (
        <div className="bg-purple-50 border border-purple-200 text-purple-950 rounded-2xl p-5 flex items-start gap-4 shadow-sm no-print">
          <div className="p-2.5 bg-purple-100 rounded-full text-purple-700 shrink-0 mt-0.5">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Đơn hàng đã được hoàn tiền</h3>
            <p className="text-sm text-purple-800/80 mt-0.5">
              Vé này không còn giá trị check-in.
            </p>
          </div>
        </div>
      )}

      {/* ── Event summary card ── */}
      <Card className="overflow-hidden border rounded-2xl shadow-sm bg-card/40 backdrop-blur no-print">
        <div className="flex flex-col md:flex-row">
          {order.event.bannerUrl && (
            <div className="relative h-44 md:h-auto md:w-1/3 bg-muted shrink-0">
              <img
                src={order.event.bannerUrl}
                alt={order.event.title}
                className="object-cover w-full h-full absolute inset-0"
              />
            </div>
          )}
          <div className="p-6 flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded">
                  Đơn hàng: {order.orderNumber}
                </span>
                {statusBadge()}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">{order.event.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>{format(eventDate, "EEEE, d MMMM yyyy 'lúc' HH:mm", { locale: vi })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">{order.event.venue}, {order.event.city}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Người đặt vé</p>
                <div className="flex items-center gap-1.5 font-bold">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.buyer?.name || "Khách hàng"}</span>
                </div>
              </div>
              <div className="flex gap-8 text-right">
                <div>
                  <span className="text-xs text-muted-foreground block">Số vé</span>
                  <span className="font-semibold">{order.items?.length || 0} vé</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Tổng cộng</span>
                  <span className="font-extrabold text-primary text-lg">
                    {Math.max(0, Number(order.subtotal) - Number(order.discount || 0)).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── E-Tickets ── */}
      <div className="space-y-5">
        <div className="no-print">
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Vé điện tử ({order.items?.length || 0})
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Mỗi vé có mã vạch soát vé riêng. Vui lòng đưa mã vạch tại quầy soát vé để vào cổng.
          </p>
        </div>

        <div className="flex flex-col gap-5 print:gap-8">
          {order.items?.map((item: any) => {
            const ticketTypeName =
              item.ticketType?.name || (item.seat ? "Vé Có Số Ghế" : "General Admission");
            const seatLabel = item.seat
              ? `Hàng ${item.seat.row?.rowLabel} — Ghế ${item.seat.seatLabel}${item.seat.row?.section?.name ? ` (${item.seat.row.section.name})` : ""}`
              : undefined;

            return (
              <div key={item.id}>
                <EventTicket
                  ticketCode={item.ticketCode || `PENDING-${item.id}`}
                  eventTitle={order.event.title}
                  bannerUrl={order.event.bannerUrl}
                  category={order.event.category || "Sự kiện"}
                  ticketType={ticketTypeName}
                  startDate={order.event.startDate}
                  venue={order.event.venue}
                  city={order.event.city}
                  seatInfo={seatLabel}
                  status={order.status}
                  isCheckedIn={item.isCheckedIn}
                  holderName={order.buyer?.name}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Refund Modal ── */}
      {showRefundModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-card rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <RotateCcw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Yêu cầu hoàn tiền</h3>
                <p className="text-xs text-muted-foreground">Mã đơn: {order.orderNumber}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vui lòng nhập lý do yêu cầu hoàn tiền. Ban quản trị sẽ kiểm tra và phản hồi sớm nhất.
            </p>
            <Textarea
              placeholder="Nhập lý do chi tiết (sự kiện hoãn/hủy, lý do cá nhân, ...)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex gap-3 justify-end pt-1">
              <Button variant="ghost" onClick={() => setShowRefundModal(false)}>
                Huỷ
              </Button>
              <Button
                onClick={handleRequestRefund}
                disabled={isSubmittingRefund || !refundReason.trim()}
                className="gap-2 rounded-xl font-bold"
              >
                {isSubmittingRefund ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang gửi…
                  </>
                ) : (
                  "Gửi yêu cầu"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
