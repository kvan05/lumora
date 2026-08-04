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
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  Mail,
  Home,
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

  // Recipient Information Form State
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (session?.user) {
      setRecipientName(session.user.name || "");
      setRecipientEmail(session.user.email || "");
      if ((session.user as any).phone) {
        setRecipientPhone((session.user as any).phone);
      }
    }
  }, [session]);

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

  const handleConfirmAndPay = async () => {
    if (!order) return;
    if (!recipientName.trim()) {
      toast.error("Vui lòng nhập Tên người nhận vé");
      return;
    }
    if (!recipientPhone.trim()) {
      toast.error("Vui lòng nhập Số điện thoại nhận vé");
      return;
    }
    if (!recipientEmail.trim()) {
      toast.error("Vui lòng nhập Email nhận vé");
      return;
    }

    setIsProcessing(true);
    try {
      // Create VietQR PayOS payment link
      const res = await api.post("/payment/create", { orderId: order.id });

      if (res.data.success) {
        const { checkoutUrl } = res.data.data;
        toast.success("Đang chuyển hướng tới cổng thanh toán PayOS...");
        // Redirect directly to PayOS payment screen
        window.location.href = checkoutUrl;
      } else {
        toast.error("Không thể tạo liên kết thanh toán PayOS.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Lỗi khi tạo thanh toán");
    } finally {
      setIsProcessing(false);
    }
  };

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
          <p className="text-muted-foreground">Xem lại đơn hàng và hoàn tất thông tin nhận vé.</p>
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
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Giảm giá</span>
                      <span>- {Number(order.discount).toLocaleString("vi-VN")} ₫</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-extrabold text-foreground pt-3 border-t border-border/50">
                    <span>Tổng cộng</span>
                    <span className="text-[#4A7C59] dark:text-[#93C453] text-2xl">
                      {Math.max(0, Number(order.subtotal) - Number(order.discount || 0)).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Receiver Information & Direct PayOS Payment Form */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
              <div className="bg-muted/30 border-b border-border/40 p-6">
                <h3 className="text-lg font-extrabold text-foreground">Cập nhật thông tin nhận vé</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Nhập thông tin nhận vé chính xác để hệ thống gửi vé QR và hóa đơn.
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Tên người nhận */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tên người nhận *</label>
                  <Input
                    placeholder="Nhập tên người nhận..."
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Số điện thoại *</label>
                  <Input
                    placeholder="Nhập số điện thoại..."
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Email *</label>
                  <Input
                    type="email"
                    placeholder="phanthikhanhvan2505@gmail.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="h-11 rounded-xl bg-muted/20"
                  />
                </div>

                <div className="pt-2 pb-1 border-t border-border/40">
                  <p className="text-xs font-bold text-muted-foreground">
                    Địa chỉ nhận hàng (vui lòng cập nhật khi mua vé cứng)
                  </p>
                </div>

                {/* Tỉnh/Thành phố */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Tỉnh/Thành Phố</label>
                  <Input
                    placeholder="Chọn Tỉnh/Thành Phố"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Quận/Huyện */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Quận/Huyện</label>
                  <Input
                    placeholder="Chọn Quận/Huyện"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Phường/Xã */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Phường/Xã</label>
                  <Input
                    placeholder="Chọn Phường/Xã"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Địa chỉ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Địa chỉ</label>
                  <Input
                    placeholder="Nhập địa chỉ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Lưu ý */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-foreground">Lưu ý</label>
                    <span className="text-[10px] text-muted-foreground">{note.length} / 50</span>
                  </div>
                  <Input
                    placeholder="Lưu ý ghi chú thêm"
                    maxLength={50}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Bottom Buttons: Huỷ bỏ & Xác nhận */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl font-bold border-[#93C453] text-[#4A7C59] dark:text-[#93C453] hover:bg-[#93C453]/10"
                    onClick={() => router.back()}
                  >
                    Huỷ bỏ
                  </Button>

                  <Button
                    type="button"
                    className="h-12 rounded-xl font-extrabold bg-[#93C453] hover:bg-[#82B342] text-slate-900 shadow-md flex items-center justify-center gap-2"
                    onClick={handleConfirmAndPay}
                    disabled={isProcessing || timeLeft <= 0}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Xác nhận và thanh toán
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Hệ thống sẽ chuyển thẳng tới cổng thanh toán VietQR PayOS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
