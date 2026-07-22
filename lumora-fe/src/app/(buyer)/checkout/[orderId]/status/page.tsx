"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Ticket, Home, RefreshCw, PartyPopper } from "lucide-react";

export default function PaymentStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [status, setStatus] = useState<"LOADING" | "SUCCESS" | "FAILED" | "CANCELLED">("LOADING");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // PayOS appends ?cancel=true when user cancels on PayOS portal
  const isCancelled = searchParams.get("cancel") === "true";

  useEffect(() => {
    if (isCancelled) {
      setStatus("CANCELLED");
      return;
    }

    let attempts = 0;
    const maxAttempts = 30; // 30 × 2s = 60s

    const checkStatus = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data.success) {
          const order = res.data.data;
          setOrderDetails(order);

          if (order.status === "CONFIRMED") {
            setStatus("SUCCESS");
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (order.status === "CANCELLED" || order.status === "FAILED") {
            setStatus("FAILED");
            if (pollRef.current) clearInterval(pollRef.current);
          } else {
            attempts++;
            if (attempts >= maxAttempts) {
              setStatus("FAILED");
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus("FAILED");
      }
    };

    checkStatus();
    pollRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, isCancelled]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-md">
        {/* LOADING */}
        {status === "LOADING" && (
          <div className="rounded-3xl border border-border/50 bg-card shadow-xl p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-14 w-14 text-primary animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping opacity-30" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Đang xác minh thanh toán...</h2>
              <p className="text-muted-foreground mt-2">
                Vui lòng chờ trong khi chúng tôi xác nhận giao dịch của bạn với PayOS. Đừng đóng
                trang này.
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === "SUCCESS" && (
          <div className="rounded-3xl border border-green-200/60 dark:border-green-900/40 bg-card shadow-xl p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1.5 animate-bounce">
                <PartyPopper className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                Thanh toán thành công!
              </h2>
              <p className="text-muted-foreground mt-2">
                Vé của bạn đã được xác nhận. Email xác nhận đã được gửi đến hộp thư của bạn.
              </p>
            </div>

            {orderDetails && (
              <div className="w-full bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl p-4 text-left space-y-2">
                <p className="text-sm font-bold text-green-700 dark:text-green-400">
                  📋 Thông tin đơn hàng
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Sự kiện</span>
                    <span className="font-semibold text-foreground line-clamp-1 max-w-[180px]">
                      {orderDetails.event?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số vé</span>
                    <span className="font-semibold text-foreground">
                      {orderDetails.items?.length} vé
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng tiền</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {Number(orderDetails.total).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full space-y-3">
              <Button size="lg" className="w-full rounded-2xl h-12 font-bold" asChild>
                <Link href={`/orders/${orderId}`}>
                  <Ticket className="mr-2 h-5 w-5" />
                  Xem vé của tôi
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full rounded-2xl h-12" asChild>
                <Link href="/events">Tiếp tục khám phá sự kiện</Link>
              </Button>
            </div>
          </div>
        )}

        {/* FAILED / CANCELLED */}
        {(status === "FAILED" || status === "CANCELLED") && (
          <div className="rounded-3xl border border-destructive/20 bg-card shadow-xl p-10 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-28 h-28 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-destructive">
                {status === "CANCELLED" ? "Thanh toán đã bị hủy" : "Thanh toán thất bại"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {status === "CANCELLED"
                  ? "Bạn đã hủy quá trình thanh toán. Chỗ đặt vẫn được giữ cho đến khi hết hạn. Bạn có thể thử lại."
                  : "Chúng tôi không thể xác minh thanh toán của bạn. Nếu bạn đã bị trừ tiền, hãy liên hệ bộ phận hỗ trợ."}
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button size="lg" className="w-full rounded-2xl h-12 font-bold" asChild>
                <Link href={`/checkout/${orderId}`}>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Thử thanh toán lại
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full rounded-2xl h-12" asChild>
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Về trang chủ
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
