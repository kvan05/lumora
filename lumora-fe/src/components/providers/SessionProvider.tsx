"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import api, { clearMemoryAuth, getMemoryAccessToken } from "@/lib/api";
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
import { Clock, LogOut, RefreshCw, ShoppingBag } from "lucide-react";

// Config: 30 minutes Idle Timeout, 5 minutes Warning Window (Modal at 25th min)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes warning countdown
const WARNING_TRIGGER_MS = IDLE_TIMEOUT_MS - WARNING_BEFORE_MS; // 25 minutes (1,500,000 ms)

// Format seconds into MM:SS (e.g. 299 -> "04:59")
function formatMinutesSeconds(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function IdleTimeoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 mins default
  const [isExtending, setIsExtending] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);
  const idleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCheckoutRoute = pathname?.startsWith("/checkout");
  const isAuthenticated = !!session || !!getMemoryAccessToken();

  // ─── Reset Activity Timestamp & Sync Multi-Tab ─────────────────────────
  const resetActivity = useCallback((broadcast: boolean = true) => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("lumora_last_activity", now.toString());
        if (broadcast) {
          localStorage.setItem("lumora_session_event", JSON.stringify({ type: "ACTIVITY", timestamp: now }));
        }
      } catch (e) {}
    }
  }, []);

  // ─── Logout Handler ───────────────────────────────────────────────────
  const handleLogout = useCallback(
    async (reason: "user" | "timeout" = "user") => {
      setShowWarningModal(false);

      // Save draft if on checkout page
      if (isCheckoutRoute && typeof window !== "undefined") {
        try {
          localStorage.setItem("checkout_draft_url", pathname);
          toast.info("Đã lưu trang thanh toán dở dang. Bạn có thể tiếp tục sau khi đăng nhập.");
        } catch (e) {}
      }

      // Sync multi-tab logout
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("lumora_session_event", JSON.stringify({ type: "LOGOUT", timestamp: Date.now() }));
        } catch (e) {}
      }

      try {
        await api.post("/auth/logout").catch(() => {});
      } catch (e) {}

      clearMemoryAuth();

      if (reason === "timeout") {
        toast.error("Phiên đăng nhập đã hết", {
          description: "Bạn đã không hoạt động trong 30 phút. Vui lòng đăng nhập lại để tiếp tục.",
          duration: 6000,
        });
      }

      await signOut({ redirect: false });

      if (typeof window !== "undefined" && !pathname?.startsWith("/login")) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      }
    },
    [pathname, isCheckoutRoute, router]
  );

  // ─── Extend Session Handler ────────────────────────────────────────────
  const handleExtendSession = useCallback(async () => {
    setIsExtending(true);
    try {
      resetActivity(true);
      setShowWarningModal(false);
      toast.success("Đã tiếp tục phiên đăng nhập!");
    } catch (e) {
      toast.error("Không thể gia hạn phiên. Vui lòng đăng nhập lại.");
      handleLogout("user");
    } finally {
      setIsExtending(false);
    }
  }, [resetActivity, handleLogout]);

  // ─── Initialize Activity Timestamp from Storage ────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lumora_last_activity");
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          lastActivityRef.current = parsed;
        }
      }
    }
  }, []);

  // ─── Throttled User Activity Listeners ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "pointerdown",
    ];

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity updates to once every 2 seconds
      if (now - lastThrottleRef.current > 2000) {
        lastThrottleRef.current = now;
        
        // If warning modal is open, user activity resets idle and closes modal
        if (showWarningModal) {
          setShowWarningModal(false);
        }
        resetActivity(true);
      }
    };

    events.forEach((evt) =>
      window.addEventListener(evt, handleUserActivity, { passive: true })
    );

    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, handleUserActivity)
      );
    };
  }, [isAuthenticated, showWarningModal, resetActivity]);

  // ─── Multi-Tab Synchronization (BroadcastChannel & Storage Event) ──────
  useEffect(() => {
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
          } else if (parsed.type === "ACTIVITY" || parsed.type === "EXTEND_SESSION") {
            if (parsed.timestamp) {
              lastActivityRef.current = parsed.timestamp;
            }
            setShowWarningModal(false);
          }
        } catch (err) {}
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [pathname, router]);

  // ─── Idle Checker Loop (Timestamp-based, every 3 seconds) ───────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarningModal(false);
      return;
    }

    idleCheckIntervalRef.current = setInterval(() => {
      const idleDuration = Date.now() - lastActivityRef.current;

      // 1. Fully Timed Out (>= 30 mins)
      if (idleDuration >= IDLE_TIMEOUT_MS) {
        if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
        handleLogout("timeout");
        return;
      }

      // 2. Warning Threshold Reached (>= 25 mins)
      if (idleDuration >= WARNING_TRIGGER_MS) {
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - idleDuration) / 1000));
        setSecondsLeft(remaining);
        if (!showWarningModal) {
          setShowWarningModal(true);
        }
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 3000);

    return () => {
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
    };
  }, [isAuthenticated, showWarningModal, handleLogout]);

  // ─── Warning Countdown Decrementer (every 1 second) ───────────────────
  useEffect(() => {
    if (showWarningModal) {
      countdownIntervalRef.current = setInterval(() => {
        const idleDuration = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - idleDuration) / 1000));

        if (remaining <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleLogout("timeout");
        } else {
          setSecondsLeft(remaining);
        }
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarningModal, handleLogout]);

  return (
    <>
      {children}

      {/* Requirement 5 & 6: 30-Min Idle Warning Modal (5-Min Countdown MM:SS) */}
      <Dialog open={showWarningModal} onOpenChange={(op) => !op && handleLogout("user")}>
        <DialogContent className="rounded-3xl max-w-md p-6 border-2 border-amber-500/40 bg-card shadow-2xl animate-in zoom-in duration-200">
          <DialogHeader className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="h-7 w-7 animate-pulse text-amber-500" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-center tracking-tight">
              Phiên đăng nhập sắp hết
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-muted-foreground leading-relaxed">
              Bạn đã không hoạt động trong một thời gian. Bạn sẽ được tự động đăng xuất sau{" "}
              <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-base bg-amber-500/10 px-2 py-0.5 rounded-lg inline-block border border-amber-500/20">
                {formatMinutesSeconds(secondsLeft)}
              </span>{" "}
              nếu không có thao tác.
            </DialogDescription>
          </DialogHeader>

          {isCheckoutRoute && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Bạn đang trong quá trình đặt vé! Hãy bấm <strong>Tiếp tục phiên</strong> để bảo toàn đơn hàng.</span>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => handleLogout("user")}
              className="w-full sm:w-auto rounded-2xl h-11 font-bold text-destructive hover:bg-destructive/10 border-destructive/20 gap-2"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
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
