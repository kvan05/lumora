"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import api, {
  setMemoryAccessToken,
  clearMemoryAuth,
  broadcastSessionEvent,
  getMemoryAccessToken,
} from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, ShieldAlert, LogOut, RefreshCw, ShoppingBag } from "lucide-react";

// Config: 30 minutes Idle Timeout, 1 minute Warning Period
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 mins
const WARNING_BEFORE_MS = 1 * 60 * 1000; // 1 min before (29th min)
const WARNING_TRIGGER_MS = IDLE_TIMEOUT_MS - WARNING_BEFORE_MS; // 29 mins

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isExtending, setIsExtending] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const idleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningCountdownRef = useRef<NodeJS.Timeout | null>(null);

  const isCheckoutRoute = pathname?.startsWith("/checkout");

  // ─── Reset Activity Timestamp ──────────────────────────────────────────
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // ─── Extend Session Handler ────────────────────────────────────────────
  const handleExtendSession = useCallback(async () => {
    setIsExtending(true);
    try {
      // Call silent refresh to renew access token & session
      const res = await api.post("/auth/refresh");
      if (res.data?.success && res.data?.data?.accessToken) {
        setMemoryAccessToken(res.data.data.accessToken, res.data.data.user);
        resetActivity();
        setShowWarningModal(false);
        broadcastSessionEvent("EXTEND_SESSION");
        toast.success("Đã gia hạn phiên đăng nhập thành công!");
      }
    } catch (e) {
      toast.error("Không thể gia hạn phiên. Vui lòng đăng nhập lại.");
      handleLogout();
    } finally {
      setIsExtending(false);
    }
  }, [resetActivity]);

  // ─── Logout Handler ───────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    setShowWarningModal(false);
    
    // Save draft if on checkout page
    if (isCheckoutRoute && typeof window !== "undefined") {
      try {
        localStorage.setItem("checkout_draft_url", pathname);
        toast.info("Đã lưu trang thanh toán dở dang. Bạn có thể tiếp tục sau khi đăng nhập.");
      } catch (e) {}
    }

    try {
      await api.post("/auth/logout");
    } catch (e) {}

    clearMemoryAuth();
    broadcastSessionEvent("LOGOUT");

    if (typeof window !== "undefined" && !pathname?.startsWith("/login")) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
    }
  }, [pathname, isCheckoutRoute, router]);

  // ─── Silent Session Init on Mount ──────────────────────────────────────
  useEffect(() => {
    const initSession = async () => {
      let token = getMemoryAccessToken();
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("lumora_token");
        if (token) setMemoryAccessToken(token);
      }

      const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("lumora_refresh_token") : null;
      try {
        const res = await api.post("/auth/refresh", { refreshToken: storedRefreshToken });
        if (res.data?.success && res.data?.data?.accessToken) {
          setMemoryAccessToken(res.data.data.accessToken, res.data.data.user);
        }
      } catch (e) {
        // Refresh token unverified
      }
    };

    initSession();
  }, []);

  // ─── Activity Listeners Setup ──────────────────────────────────────────
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    const handleUserActivity = () => {
      // Only reset activity if warning modal is not currently open
      if (!showWarningModal) {
        resetActivity();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [showWarningModal, resetActivity]);

  // ─── Multi-Tab Broadcast & Storage Listener ────────────────────────────
  useEffect(() => {
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (!event.data) return;
      const { type } = event.data;

      if (type === "LOGOUT") {
        clearMemoryAuth();
        setShowWarningModal(false);
        if (!pathname?.startsWith("/login")) {
          router.push("/login");
        }
      } else if (type === "EXTEND_SESSION") {
        resetActivity();
        setShowWarningModal(false);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "lumora_session_event" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type === "LOGOUT") {
            clearMemoryAuth();
            setShowWarningModal(false);
            if (!pathname?.startsWith("/login")) {
              router.push("/login");
            }
          } else if (parsed.type === "EXTEND_SESSION") {
            resetActivity();
            setShowWarningModal(false);
          }
        } catch (err) {}
      }
    };

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("lumora_session_sync");
        channel.onmessage = handleBroadcastMessage;
      } catch (e) {}
    }

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [pathname, router, resetActivity]);

  // ─── Idle Checker Interval (Check every 5 seconds) ────────────────────
  useEffect(() => {
    idleCheckIntervalRef.current = setInterval(() => {
      // Only check idle status if an access token is in memory (User is logged in)
      if (!getMemoryAccessToken()) return;

      const idleDuration = Date.now() - lastActivityRef.current;

      if (idleDuration >= WARNING_TRIGGER_MS && !showWarningModal) {
        setShowWarningModal(true);
        setSecondsLeft(60);
      }
    }, 5000);

    return () => {
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
    };
  }, [showWarningModal]);

  // ─── Warning Countdown Timer (1 minute) ──────────────────────────────
  useEffect(() => {
    if (showWarningModal) {
      warningCountdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (warningCountdownRef.current) clearInterval(warningCountdownRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (warningCountdownRef.current) clearInterval(warningCountdownRef.current);
    }

    return () => {
      if (warningCountdownRef.current) clearInterval(warningCountdownRef.current);
    };
  }, [showWarningModal, handleLogout]);

  return (
    <>
      {children}

      {/* Requirement 1 & 6: Idle Timeout Warning Modal */}
      <Dialog open={showWarningModal} onOpenChange={(op) => !op && handleLogout()}>
        <DialogContent className="rounded-3xl max-w-md p-6 border-2 border-[#93C453]/40 bg-card shadow-2xl animate-in zoom-in duration-200">
          <DialogHeader className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="h-7 w-7 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-center tracking-tight">
              Cảnh Báo Hết Hạn Phiên Đăng Nhập
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-muted-foreground leading-relaxed">
              Phiên đăng nhập sẽ hết hạn sau <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">{secondsLeft} giây</span> do bạn không thao tác trên hệ thống.
            </DialogDescription>
          </DialogHeader>

          {isCheckoutRoute && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>Bạn đang trong quá trình thanh toán! Hãy bấm <strong>Tiếp tục phiên</strong> để giữ nguyên đơn vé của bạn.</span>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full sm:w-auto rounded-2xl h-11 font-bold text-destructive hover:bg-destructive/10 border-destructive/20 gap-2"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất ngay
            </Button>
            <Button
              onClick={handleExtendSession}
              disabled={isExtending}
              className="w-full sm:w-auto rounded-2xl h-11 font-extrabold bg-[#93C453] hover:bg-[#82B342] text-slate-900 shadow-md gap-2"
            >
              {isExtending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Tiếp tục phiên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
