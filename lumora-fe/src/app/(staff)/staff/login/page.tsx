"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { saveStaffSession } from "@/lib/staff-auth";
import { toast } from "sonner";
import { Eye, EyeOff, ScanLine, Lock, Mail, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const res = await axios.post(`${apiUrl}/auth/login`, {
        identifier: email.trim(),
        email: email.trim(),
        password,
        rememberMe: false,
      });

      const data = res.data?.data;
      if (!data?.accessToken || !data?.user) {
        throw new Error("Đăng nhập thất bại");
      }

      if (data.user.role !== "STAFF") {
        setErrorMsg("Tài khoản này không phải tài khoản nhân viên. Vui lòng dùng đúng trang đăng nhập.");
        return;
      }

      saveStaffSession(data.accessToken, {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
      });

      toast.success(`Chào mừng, ${data.user.name || data.user.email}!`);
      router.replace("/staff/events");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Đăng nhập thất bại. Kiểm tra email/mật khẩu.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060610] flex flex-col items-center justify-center px-5 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo / Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30">
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Lumora Staff</h1>
            <p className="text-zinc-500 text-sm mt-1">Hệ thống kiểm soát vào cửa</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-7 space-y-5 shadow-2xl">
          <div>
            <h2 className="text-lg font-semibold text-white">Đăng nhập</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Dành cho nhân viên soát vé</p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-zinc-300 text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-zinc-300 text-sm font-medium">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="staff-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="staff-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang đăng nhập...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Đăng nhập</>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-zinc-600 text-xs">
          Tài khoản được cấp bởi Seller quản lý sự kiện.<br />
          Nếu gặp vấn đề, vui lòng liên hệ quản lý của bạn.
        </p>
      </div>
    </div>
  );
}
