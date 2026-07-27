"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Ticket,
  ShieldCheck,
  MapPin,
  Calendar,
  QrCode,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [qrData, setQrData] = useState<{
    checkoutUrl: string;
    qrCode: string;
    amount: number;
    orderNumber: string;
  } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data.success) {
          const fetchedOrder = res.data.data;

          if (fetchedOrder.status !== "PENDING") {
            toast.info("Đơn hàng này đã được xử lý.");
            router.push(`/orders/${fetchedOrder.id}`);
            return;
          }

          setOrder(fetchedOrder);

          const expiresAt = new Date(fetchedOrder.expiresAt).getTime();
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeLeft(remaining);
        }
      } catch (error) {
        toast.error("Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchOrder();
  }, [orderId, router, session]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (order?.status === "PENDING") {
        toast.error("Đặt chỗ đã hết hạn. Vui lòng đặt vé lại.");
        router.push(`/events/${order.event?.slug || order.event?.id}`);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, order, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isExpiringSoon = timeLeft > 0 && timeLeft <= 60;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !order) return;
    setIsApplyingVoucher(true);
    try {
      const res = await api.patch(`/orders/${order.id}/apply-voucher`, { code: voucherCode });
      if (res.data.success) {
        setOrder(res.data.data);
        toast.success("Áp dụng mã giảm giá thành công!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Mã giảm giá không hợp lệ");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleGeneratePayment = useCallback(async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      const res = await api.post("/payment/create", { orderId: order.id });

      if (res.data.success) {
        const { checkoutUrl, qrCode, amount, orderNumber } = res.data.data;
        setQrData({ checkoutUrl, qrCode, amount, orderNumber });
        toast.success("Đã tạo mã thanh toán! Quét QR hoặc bấm nút để thanh toán.");
      } else {
        toast.error("Không thể tạo liên kết thanh toán.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Lỗi khi tạo thanh toán");
    } finally {
      setIsProcessing(false);
    }
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          <Skeleton className="h-[500px] w-full rounded-3xl" />
          <Skeleton className="h-[500px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-background to-muted/30 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight">Thanh toán đặt vé</h1>
          <p className="text-muted-foreground">Xem lại đơn hàng và hoàn tất thanh toán của bạn.</p>
        </div>

        {/* Countdown Timer */}
        <div
          className={`flex items-center justify-center gap-3 rounded-2xl p-4 border font-bold text-lg transition-colors ${
            isExpiringSoon
              ? "bg-destructive/10 border-destructive/30 text-destructive animate-pulse"
              : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400"
          }`}
        >
          <Clock className="h-5 w-5" />
          <span>
            {timeLeft <= 0
              ? "Đặt chỗ đã hết hạn!"
              : `Chỗ ngồi của bạn được giữ trong: ${formatTime(timeLeft)}`}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Order Summary */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
              {/* Event banner + title */}
              <div className="relative h-40 bg-muted overflow-hidden">
                {order.event?.bannerUrl ? (
                  <Image
                    src={order.event.bannerUrl}
                    alt={order.event.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Ticket className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-white font-extrabold text-xl line-clamp-2">
                    {order.event?.title}
                  </h2>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {order.event?.startDate
                      ? format(new Date(order.event.startDate), "dd/MM/yyyy HH:mm", { locale: vi })
                      : "—"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {order.event?.venue}
                  </div>
                </div>

                <Separator />

                {/* Order items */}
                <div className="space-y-2">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Ticket className="h-4 w-4" /> Danh sách vé
                  </h3>
                  {order.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-muted/30 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-sm">
                          {item.seat
                            ? `Ghế ${item.seat.seatLabel}`
                            : item.ticketType?.name || "Vé vào cổng"}
                        </p>
                        {item.seat && (
                          <p className="text-xs text-muted-foreground">
                            {item.seat.section || ""}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="font-bold text-sm">
                        {Number(item.unitPrice).toLocaleString("vi-VN")} ₫
                      </Badge>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Voucher Input */}
                {!order.voucherCode ? (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nhập mã giảm giá" 
                      value={voucherCode} 
                      onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                      className="uppercase h-10"
                    />
                    <Button 
                      variant="secondary" 
                      className="h-10 px-6 font-bold"
                      onClick={handleApplyVoucher} 
                      disabled={isApplyingVoucher || !voucherCode.trim()}
                    >
                      {isApplyingVoucher ? "..." : "Áp dụng"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 px-3 py-2.5 rounded-xl border border-emerald-200">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <Ticket className="h-4 w-4" /> Đã áp dụng: {order.voucherCode}
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none border-emerald-200 border">
                      - {Number(order.discount || 0).toLocaleString("vi-VN")} ₫
                    </Badge>
                  </div>
                )}

                <Separator />

                {/* Totals */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Tạm tính</span>
                    <span>{Number(order.subtotal).toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Phí dịch vụ</span>
                    <span>{Number(order.fees).toLocaleString("vi-VN")} ₫</span>
                  </div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Giảm giá</span>
                      <span>- {Number(order.discount).toLocaleString("vi-VN")} ₫</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-extrabold text-foreground pt-3 border-t border-border/50">
                    <span>Tổng cộng</span>
                    <span className="text-primary text-2xl">
                      {Number(order.total).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Payment panel */}
          <div className="space-y-4">
            {!qrData ? (
              /* Step 1: Generate payment */
              <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
                <div className="bg-primary/5 border-b border-border/40 p-6">
                  <h3 className="text-lg font-extrabold">Phương thức thanh toán</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Lumora sử dụng PayOS — cổng thanh toán VietQR hàng đầu Việt Nam.
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {/* PayOS card option */}
                  <div className="border-2 border-primary rounded-2xl p-5 bg-primary/5 flex items-start gap-4 cursor-pointer">
                    <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center bg-primary shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">VietQR / Ngân hàng nội địa</p>
                      <p className="text-sm text-muted-foreground">
                        Quét mã QR bằng app ngân hàng bất kỳ. Hỗ trợ 40+ ngân hàng Việt Nam.
                      </p>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {["VCB", "TCB", "MB", "ACB", "VPB"].map((bank) => (
                          <span
                            key={bank}
                            className="text-[10px] font-bold bg-muted px-2 py-1 rounded-lg text-muted-foreground"
                          >
                            {bank}
                          </span>
                        ))}
                        <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded-lg text-muted-foreground">
                          +35 nữa
                        </span>
                      </div>
                    </div>
                    <QrCode className="h-8 w-8 text-primary shrink-0" />
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-extrabold rounded-2xl shadow-md"
                    onClick={handleGeneratePayment}
                    disabled={isProcessing || timeLeft <= 0}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Đang tạo mã thanh toán...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-5 w-5" />
                        Tạo mã QR thanh toán
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    Thanh toán an toàn, được mã hóa bởi PayOS
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2: Show QR + redirect button */
              <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-green-500/10 border-b border-green-200/50 dark:border-green-900/30 p-6 text-center">
                  <h3 className="text-lg font-extrabold text-green-700 dark:text-green-400">
                    Mã QR đã sẵn sàng!
                  </h3>
                  <p className="text-sm text-green-600/80 dark:text-green-400/70 mt-1">
                    Quét bằng app ngân hàng hoặc ví điện tử của bạn.
                  </p>
                </div>

                <div className="p-6 flex flex-col items-center gap-6">
                  {/* QR Code */}
                  <div className="relative border-4 border-primary/20 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={qrData.qrCode}
                      alt="Mã QR thanh toán"
                      width={250}
                      height={250}
                      className="block"
                      unoptimized
                    />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="font-extrabold text-2xl text-primary">
                      {qrData.amount.toLocaleString("vi-VN")} ₫
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mã đơn: <span className="font-mono font-bold">{qrData.orderNumber}</span>
                    </p>
                  </div>

                  <div className="w-full space-y-3">
                    <Button
                      size="lg"
                      className="w-full h-12 text-base font-bold rounded-2xl"
                      onClick={() => window.open(qrData.checkoutUrl, "_blank")}
                    >
                      Mở cổng thanh toán PayOS
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl"
                      onClick={() => router.push(`/checkout/${orderId}/status`)}
                    >
                      Tôi đã thanh toán xong →
                    </Button>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-3 text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>
                      Đừng đóng trang này. Sau khi thanh toán thành công, hệ thống sẽ tự động xác
                      nhận đơn hàng của bạn trong vài giây.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
