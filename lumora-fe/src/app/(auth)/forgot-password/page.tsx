"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const emailSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onStep1Submit(values: z.infer<typeof emailSchema>) {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        email: values.email,
      });

      if (res.data.success) {
        setEmail(values.email);
        setStep(2);
        toast.success(res.data.message || "Đã gửi mã OTP. Vui lòng kiểm tra email.");
      }
    } catch (error: any) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }

  function onStep2Submit() {
    if (otp.length === 6) {
      setStep(3);
    }
  }

  async function onStep3Submit(values: z.infer<typeof passwordSchema>) {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword: values.password,
      });

      if (res.data.success) {
        toast.success("Đặt lại mật khẩu thành công! Đang chuyển hướng...");
        router.push("/login");
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.";
      toast.error(message);
      if (error.response?.data?.error?.code === "INVALID_OTP") {
        setStep(2); // Go back to OTP if invalid
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {step === 1 && (
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 h-8 text-muted-foreground hover:text-foreground">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
            </Link>
          </Button>
        )}
        {(step === 2 || step === 3) && (
          <Button variant="ghost" size="sm" onClick={() => setStep((step - 1) as any)} className="-ml-3 mb-2 h-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
        )}

        {step === 1 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Quên mật khẩu? 🔒</h2>
            <p className="text-sm text-muted-foreground">
              Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Xác nhận OTP ✉️</h2>
            <p className="text-sm text-muted-foreground">
              Nhập mã gồm 6 chữ số vừa được gửi tới <strong>{email}</strong>.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Mật khẩu mới 🔑</h2>
            <p className="text-sm text-muted-foreground">
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </>
        )}
      </div>

      {step === 1 && (
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onStep1Submit)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Email đăng ký</FormLabel>
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
            <Button
              type="submit"
              className="w-full h-11 font-bold text-base rounded-xl shadow-sm mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Đang gửi..." : "Nhận mã OTP"}
            </Button>
          </form>
        </Form>
      )}

      {step === 2 && (
        <div className="space-y-6">
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
            onClick={onStep2Submit}
            className="w-full h-11 font-bold text-base rounded-xl shadow-sm mt-4"
            disabled={otp.length !== 6 || isLoading}
          >
            Tiếp tục
          </Button>
        </div>
      )}

      {step === 3 && (
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onStep3Submit)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Mật khẩu mới</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Ít nhất 6 ký tự"
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
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Xác nhận mật khẩu mới</FormLabel>
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
              className="w-full h-11 font-bold text-base rounded-xl shadow-sm mt-4"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
