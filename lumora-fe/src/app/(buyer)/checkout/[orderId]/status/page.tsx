"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Ticket, Home, RefreshCw, PartyPopper } from "lucide-react";
import { EventTicket } from "@/components/ticket/EventTicket";

export default function PaymentStatusPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;

  const [status, setStatus] = useState<"LOADING" | "SUCCESS" | "FAILED" | "CANCELLED">("LOADING");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const isCancelled = searchParams.get("cancel") === "true";
  // PayOS gắn sẵn khi redirect về
  const payosCode = searchParams.get("code");
  const payosStatus = searchParams.get("status");
  const isPayosSuccess = payosCode === "00" || payosStatus === "PAID";

  useEffect(() => {
    if (isCancelled) {
      setStatus("CANCELLED");
      return;
    }

    // Nếu PayOS đã báo thành công → hiện SUCCESS ngay (vẫn poll để lấy vé)
    if (isPayosSuccess) {
      setStatus("SUCCESS");
    }

    const attemptsRef = { current: 0 };
    const maxAttempts = 30;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data?.success) {
          const order = res.data.data;
          setOrderDetails(order);

          if (order.status === "CONFIRMED") {
            setStatus("SUCCESS");
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (order.status === "CANCELLED" || order.status === "FAILED") {
            // Chỉ set FAILED nếu PayOS không báo success
            if (!isPayosSuccess) {
              setStatus("FAILED");
              if (pollRef.current) clearInterval(pollRef.current);
            }
          } else {
            attemptsRef.current++;
            if (attemptsRef.current >= maxAttempts && !isPayosSuccess) {
              setStatus("FAILED");
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        } else {
          attemptsRef.current++;
          if (attemptsRef.current >= maxAttempts && !isPayosSuccess) {
            setStatus("FAILED");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {
        attemptsRef.current++;
        if (attemptsRef.current >= maxAttempts && !isPayosSuccess) {
          setStatus("FAILED");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }
    };

    checkStatus();
    pollRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, isCancelled, isPayosSuccess]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-md">
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
                Vui lòng chờ trong khi chúng tôi xác nhận giao dịch của bạn với PayOS. Đừng đóng trang này.
              </p>
            </div>
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="w-full max-w-2xl rounded-3xl border border-green-200/60 dark:border-green-900/40 bg-card shadow-xl p-6 md:p-8 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1.5 animate-bounce">
                <PartyPopper className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-green-600 dark:text-green-400">
                Thanh toán thành công!
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Vé của bạn đã được xác nhận.
              </p>
            </div>

            {orderDetails?.items?.length > 0 && (
              <div className="w-full text-left space-y-4 my-2">
                {orderDetails.items.map((item: any) => {
                  const ticketTypeName = item.ticketType?.name || (item.seat ? "Vé Có Số Ghế" : "General Admission");
                  const seatLabel = item.seat ? `Hàng ${item.seat.row?.rowLabel} — Ghế ${item.seat.seatLabel}` : undefined;
                  return (
                    <EventTicket
                      key={item.id}
                      ticketCode={item.ticketCode || `TKT-${item.id.slice(-6).toUpperCase()}`}
                      eventTitle={orderDetails.event?.title || "Sự kiện Lumora"}
                      bannerUrl={orderDetails.event?.bannerUrl}
                      category={orderDetails.event?.category || "Sự kiện"}
                      ticketType={ticketTypeName}
                      startDate={orderDetails.event?.startDate}
                      venue={orderDetails.event?.venue}
                      city={orderDetails.event?.city}
                      seatInfo={seatLabel}
                      status={orderDetails.status}
                      isCheckedIn={item.isCheckedIn}
                    />
                  );
                })}
              </div>
            )}

            <div className="w-full space-y-3 pt-2">
              <Button size="lg" className="w-full rounded-2xl h-12 font-bold" asChild>
                <Link href={`/orders/${orderId}`}>
                  <Ticket className="mr-2 h-5 w-5" />
                  Xem vé trong Lịch sử của tôi
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full rounded-2xl h-12" asChild>
                <Link href="/events">Tiếp tục khám phá sự kiện</Link>
              </Button>
            </div>
          </div>
        )}

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
                  ? "Bạn đã hủy quá trình thanh toán. Bạn có thể thử lại."
                  : "Chúng tôi không thể xác minh thanh toán của bạn. Nếu bạn đã bị trừ tiền, hãy liên hệ hỗ trợ."}
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