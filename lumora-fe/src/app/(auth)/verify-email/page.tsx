"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, RefreshCw, MailCheck } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for 60 seconds resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (!email) {
      toast.error("Không tìm thấy email cần xác thực. Vui lòng đăng ký lại.");
      router.push("/register");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Mã OTP phải gồm đúng 6 chữ số.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/verify", { email, otp });
      if (res.data.success) {
        toast.success("Xác thực tài khoản thành công! Vui lòng đăng nhập.");
        router.push("/login");
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || "Xác thực OTP thất bại. Vui lòng kiểm tra lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    if (!email) {
      toast.error("Không tìm thấy email.");
      return;
    }

    setIsResending(true);
    try {
      const res = await api.post("/auth/resend-otp", { email });
      if (res.data.success) {
        toast.success(res.data.message || "Mã OTP mới đã được gửi về email của bạn.");
        setCountdown(60);
        setOtp("");
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || "Không thể gửi lại mã OTP.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Link href="/register" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Quay lại đăng ký
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <MailCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Xác thực tài khoản</h2>
            <p className="text-xs text-muted-foreground">Mã OTP có hiệu lực trong 5 phút</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground pt-2">
          Chúng tôi đã gửi mã xác thực 6 số đến email: <strong className="text-foreground font-bold">{email || "bạn đã nhập"}</strong>.
        </p>
      </div>

      {/* 6-DIGIT OTP INPUT */}
      <div className="flex flex-col items-center justify-center py-4 space-y-4">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={isLoading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold font-mono" />
            <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold font-mono" />
            <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold font-mono" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold font-mono" />
            <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold font-mono" />
            <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold font-mono" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={handleVerify}
        disabled={isLoading || otp.length !== 6}
        className="w-full h-12 font-extrabold text-base rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isLoading ? "Đang xác minh OTP..." : "Xác minh tài khoản"}
      </Button>

      {/* RESEND OTP TIMER & ACTION */}
      <div className="pt-2 text-center text-sm">
        <p className="text-muted-foreground text-xs">
          Bạn chưa nhận được mã OTP?
        </p>
        <Button
          type="button"
          variant="link"
          onClick={handleResendOtp}
          disabled={countdown > 0 || isResending}
          className="font-bold text-primary text-xs mt-1"
        >
          {isResending ? (
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang gửi lại mã...
            </span>
          ) : countdown > 0 ? (
            `Gửi lại mã sau (${countdown}s)`
          ) : (
            "Gửi lại mã OTP mới"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Đang tải...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
