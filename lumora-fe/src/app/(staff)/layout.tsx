"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  isStaffLoggedIn,
  clearStaffSession,
  setupInactivityTimer,
  getStaffUser,
} from "@/lib/staff-auth";
import { toast } from "sonner";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const cleanupRef = useRef<(() => void) | null>(null);

  const isLoginPage = pathname === "/staff/login";

  useEffect(() => {
    // If not on login page and not logged in → redirect
    if (!isLoginPage && !isStaffLoggedIn()) {
      router.replace("/staff/login");
      return;
    }

    // If already logged in and on login page → redirect to events
    if (isLoginPage && isStaffLoggedIn()) {
      router.replace("/staff/events");
      return;
    }

    // Setup inactivity timer for authenticated pages
    if (!isLoginPage && isStaffLoggedIn()) {
      cleanupRef.current = setupInactivityTimer(() => {
        toast.warning("Phiên làm việc đã hết hạn do không hoạt động. Vui lòng đăng nhập lại.", {
          duration: 5000,
        });
        router.replace("/staff/login");
      });
    }

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [pathname, isLoginPage, router]);

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      {children}
    </div>
  );
}
