"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Ticket,
  LayoutDashboard,
  User,
  LogOut,
  Calendar,
  Menu,
  Heart,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

// ─── Notification Bell Component ──────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, refetch } = useQuery({
    queryKey: ["notifications-summary"],
    queryFn: async () => {
      const res = await api.get("/notifications?limit=8");
      return res.data.data;
    },
    refetchInterval: 30000, // poll every 30s
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications/all/read"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-summary"] }),
  });

  const markOneRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-summary"] }),
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  const typeColor: Record<string, string> = {
    ORDER_CONFIRMED: "bg-emerald-500",
    SEAT_RESERVED: "bg-blue-500",
    EVENT_CANCELLED: "bg-red-500",
    REVENUE_UPDATE: "bg-amber-500",
    REVIEW_REPLY: "bg-purple-500",
    DEFAULT: "bg-primary",
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          onClick={() => { setOpen(true); refetch(); }}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-extrabold px-1 shadow-md animate-bounce">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] rounded-2xl shadow-xl p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
          <span className="font-bold text-sm">Thông báo</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs font-semibold text-primary hover:text-primary/80"
              onClick={() => markAllRead.mutate()}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Không có thông báo nào</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOneRead.mutate(n.id)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40 ${!n.isRead ? "bg-primary/5" : ""}`}
              >
                <div
                  className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${typeColor[n.type] || typeColor.DEFAULT}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold" : "font-medium"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border/60 p-2">
            <Link
              href="/profile"
              className="block text-center text-xs font-semibold text-primary py-2 hover:underline"
              onClick={() => setOpen(false)}
            >
              Xem tất cả thông báo
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/events", label: "Sự kiện", icon: Calendar },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo + Nav links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-2xl font-extrabold text-primary tracking-tight shrink-0"
          >
            Lumora
          </Link>
          <nav className="hidden md:flex gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {session ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* Favorites shortcut */}
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hidden sm:flex" asChild>
                <Link href="/profile/favorites">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all p-0"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={(session.user as any)?.image || ""}
                        alt={session.user?.name || ""}
                      />
                      <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 rounded-2xl shadow-lg" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-3 pb-2">
                    <p className="text-sm font-bold leading-none">{session.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">{session.user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {(session.user as any)?.role === "SELLER" && (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                      <Link href="/seller/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        <span>Quản lý sự kiện</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link href="/orders" className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span>Vé của tôi</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link href="/profile/favorites" className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-500" />
                      <span>Sự kiện yêu thích</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-full font-semibold hidden sm:flex" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button size="sm" className="rounded-full font-semibold shadow-sm" asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger for nav links */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive(href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {session && (
            <Link
              href="/profile/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <Heart className="h-4 w-4 text-rose-500" />
              Sự kiện yêu thích
            </Link>
          )}
          {!session && (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
