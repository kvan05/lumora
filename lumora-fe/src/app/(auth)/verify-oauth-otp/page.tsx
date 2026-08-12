"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerifyOauthOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get("email");
  const name = searchParams.get("name");
  const avatar = searchParams.get("avatar");

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!email) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Lỗi xác thực</h2>
        <p className="text-muted-foreground text-sm">Thiếu thông tin email để xác thực.</p>
        <Button asChild variant="outline" className="w-full h-11 font-bold rounded-xl">
          <Link href="/login">Quay lại trang đăng nhập</Link>
        </Button>
      </div>
    );
  }

  async function onVerifyOtp() {
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    try {
      // Gọi backend verify OAuth OTP
      const res = await api.post("/auth/oauth/verify", {
        email,
        otp,
        name,
        avatar,
        provider: "google",
      });

      if (res.data.success) {
        toast.success("Xác thực thành công! Đang đăng nhập...");
        
        // Cần signIn qua credentials nhưng với 1 flow ẩn, hoặc sử dụng token backend luôn
        // Ở đây backend đã trả về accessToken, nhưng để NextAuth nhận, ta có thể dùng 1 provider Credentials ẩn, 
        // hoặc đơn giản là set cookie/localstorage, hoặc reload.
        // Để dễ nhất với NextAuth hiện tại, ta có thể không dùng signIn mà gọi signIn('credentials') 
        // Nhưng NextAuth credentials authorize() đang require password. 
        // Thay vì sửa authorize() phức tạp, ta có thể redirect user về login và báo login lại bằng Google. 
        // Lần 2 user bấm Google, backend sẽ thấy user tồn tại và trả về token -> Đăng nhập thành công.
        router.push("/login");
        setTimeout(() => {
          toast.success("Vui lòng nhấn 'Đăng nhập bằng Google' một lần nữa để tiếp tục.");
        }, 1000);
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Mã xác thực không hợp lệ.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Xác thực Google</h2>
        <p className="text-sm text-muted-foreground">
          Vui lòng nhập mã 6 số vừa được gửi tới <strong>{email}</strong> để hoàn tất liên kết tài khoản.
        </p>
      </div>

      <div className="flex justify-center py-6">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
          disabled={isLoading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
            <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
            <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
            <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
            <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={onVerifyOtp}
        className="w-full h-11 font-bold text-base rounded-xl shadow-sm"
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? "Đang xác nhận..." : "Hoàn tất xác thực"}
      </Button>

      <Button asChild variant="ghost" className="w-full h-11 font-bold rounded-xl text-muted-foreground hover:text-foreground">
        <Link href="/login">
          Hủy
        </Link>
      </Button>
    </div>
  );
}
