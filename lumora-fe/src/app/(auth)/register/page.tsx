"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, RefreshCw, MailCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Họ và tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Địa chỉ email không hợp lệ" }),
  password: z
    .string()
    .min(8, { message: "Mật khẩu phải có tối thiểu 8 ký tự" })
    .regex(/[A-Z]/, { message: "Mật khẩu phải chứa ít nhất 1 chữ hoa" })
    .regex(/[a-z]/, { message: "Mật khẩu phải chứa ít nhất 1 chữ thường" })
    .regex(/[0-9]/, { message: "Mật khẩu phải chứa ít nhất 1 chữ số" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Countdown timer for 60s cooldown on resend OTP
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  async function onRegisterSubmit(values: RegisterValues) {
    setIsLoading(true);
    try {
      const email = values.email.trim();
      const res = await api.post("/auth/register", {
        name: values.name.trim(),
        email,
        password: values.password,
      });

      if (res.data.success) {
        setRegisteredEmail(email);
        setStep(2);
        setCountdown(60);
        toast.success(res.data.message || "Đã gửi mã xác thực 6 số tới email của bạn.");
      }
    } catch (error: any) {
      console.error("Register Error Details:", error?.response?.data || error);
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        (typeof error.response?.data?.error === "string" ? error.response.data.error : null) ||
        error.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onVerifyOtp() {
    if (!registeredEmail || otp.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ 6 chữ số OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/verify", {
        email: registeredEmail,
        otp,
      });

      if (res.data.success) {
        toast.success("Xác thực tài khoản thành công! Vui lòng đăng nhập.");
        router.push("/login");
      }
    } catch (error: any) {
      console.error("Verify OTP Error Details:", error?.response?.data || error);
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        (typeof error.response?.data?.error === "string" ? error.response.data.error : null) ||
        "Mã OTP không hợp lệ hoặc đã hết hạn.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onResendOtp() {
    if (countdown > 0 || isResending || !registeredEmail) return;

    setIsResending(true);
    try {
      const res = await api.post("/auth/resend-otp", { email: registeredEmail });
      if (res.data.success) {
        toast.success(res.data.message || "Mã OTP mới đã được gửi về email.");
        setCountdown(60);
        setOtp("");
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || "Không thể gửi lại mã OTP.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      toast.error("Lỗi đăng nhập bằng tài khoản Google.");
      setIsGoogleLoading(false);
    }
  };

  // STEP 2: SCREEN NHẬP MÃ OTP
  if (step === 2) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            className="-ml-3 mb-1 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Quay lại sửa thông tin
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MailCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Xác thực Email</h2>
              <p className="text-xs text-muted-foreground">Mã OTP gồm 6 chữ số có hiệu lực trong 5 phút</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            Mã xác minh đã được gửi đến: <strong className="text-foreground font-bold">{registeredEmail}</strong>.
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
          onClick={onVerifyOtp}
          disabled={isLoading || otp.length !== 6}
          className="w-full h-12 font-extrabold text-base rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? "Đang kiểm tra mã..." : "Hoàn tất xác minh & Đăng ký"}
        </Button>

        {/* RESEND OTP */}
        <div className="pt-2 text-center text-sm">
          <p className="text-muted-foreground text-xs">Chưa nhận được mã xác thực?</p>
          <Button
            type="button"
            variant="link"
            onClick={onResendOtp}
            disabled={countdown > 0 || isResending}
            className="font-bold text-primary text-xs mt-0.5"
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

  // STEP 1: SCREEN ĐĂNG KÝ THÔNG TIN
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Tạo tài khoản mới</h2>
        <p className="text-sm text-muted-foreground">
          Đăng ký bằng email của bạn để trải nghiệm mua vé dễ dàng.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onRegisterSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Họ và tên</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Nguyễn Văn A" className="pl-10" autoComplete="name" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      className="pl-10"
                      autoComplete="email"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Mật khẩu</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Tối thiểu 8 ký tự, có chữ hoa, thường & số"
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Xác nhận mật khẩu</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 font-extrabold text-base rounded-xl shadow-sm mt-2"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? "Đang gửi mã OTP..." : "Đăng ký & Nhận mã OTP"}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-semibold">Hoặc tiếp tục với</span>
        </div>
      </div>

      <div className="w-full">
        <Button 
          variant="outline" 
          className="w-full h-11 rounded-xl font-semibold bg-background hover:bg-muted"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
          ) : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Đăng nhập bằng Google
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
