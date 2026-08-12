"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api, { setMemoryAccessToken } from "@/lib/api";

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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  identifier: z.string().min(1, { message: "Vui lòng nhập Email hoặc Username" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
  rememberMe: z.boolean(),
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false as boolean,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const trimmedIdentifier = values.identifier.trim();

      // 1. Direct login call to backend API for instant user & role verification
      const loginRes = await api.post("/auth/login", {
        identifier: trimmedIdentifier,
        email: trimmedIdentifier,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (!loginRes.data?.success || !loginRes.data?.data) {
        toast.error("Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
        return;
      }

      const userData = loginRes.data.data.user;
      const accessToken = loginRes.data.data.accessToken;
      const refreshToken = loginRes.data.data.refreshToken;
      const userRole = userData?.role || "BUYER";

      // Store memory access token
      setMemoryAccessToken(accessToken, userData);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("lumora_token", accessToken);
          if (refreshToken) localStorage.setItem("lumora_refresh_token", refreshToken);
        } catch {}
      }

      // 2. Establish NextAuth session
      try {
        await signIn("credentials", {
          redirect: false,
          identifier: trimmedIdentifier,
          email: trimmedIdentifier,
          password: values.password,
          rememberMe: values.rememberMe,
        });
      } catch {}

      toast.success("Đăng nhập thành công! Đang chuyển hướng...");

      // 3. Guaranteed role-based redirect
      if (userRole === "ADMIN") {
        window.location.href = "/admin";
      } else if (userRole === "SELLER") {
        window.location.href = "/seller/dashboard";
      } else {
        const dest = callbackUrl && callbackUrl !== "/login" ? callbackUrl : "/";
        window.location.href = dest;
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        "Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOAuthSignIn = async (provider: "google") => {
    if (provider === "google") setIsGoogleLoading(true);
    
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      toast.error("Lỗi đăng nhập bằng mạng xã hội.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Chào mừng trở lại</h2>
        <p className="text-sm text-muted-foreground">
          Nhập thông tin tài khoản để tiếp tục đặt vé.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Email hoặc Username</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nhập email hoặc username"
                      className="pl-10"
                      autoComplete="username"
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
                <div className="flex items-center justify-between">
                  <FormLabel className="font-semibold">Mật khẩu</FormLabel>
                  <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      autoComplete="current-password"
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
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md py-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-medium text-sm cursor-pointer">
                    Ghi nhớ đăng nhập
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 font-bold text-base rounded-xl shadow-sm mt-2"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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
          onClick={() => handleOAuthSignIn("google")}
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
          Google
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
