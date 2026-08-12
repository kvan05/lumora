"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  LayoutDashboard, Users, Calendar, Ticket, ShoppingCart, Barcode,
  CreditCard, TrendingUp, RefreshCw, Star, Tags, Megaphone, FileText,
  Flag, ShieldCheck, ChevronRight, Menu, X, Bell, LogOut, Settings,
  ChevronDown, User, BarChart3, AlertCircle, Cog, BookOpen, Tag,
  AlertTriangle, Scale, History, HeartPulse, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Tổng quan",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Control Center", exact: true },
    ],
  },
  {
    label: "Điều hành & Giám sát",
    items: [
      { href: "/admin/risk-alerts", icon: ShieldAlert, label: "Phát hiện rủi ro (Risk)" },
      { href: "/admin/reconciliation", icon: Scale, label: "Đối soát tài chính" },
      { href: "/admin/audit-logs", icon: History, label: "System Audit Logs" },
    ],
  },
  {
    label: "Người dùng",
    items: [
      { href: "/admin/users", icon: Users, label: "Quản lý tài khoản" },
      { href: "/admin/users/organizers", icon: ShieldCheck, label: "Nhà tổ chức" },
    ],
  },
  {
    label: "Sự kiện & Vé",
    items: [
      { href: "/admin/events", icon: Calendar, label: "Quản lý sự kiện" },
      { href: "/admin/tickets", icon: Ticket, label: "Quản lý vé" },
      { href: "/admin/checkin", icon: Barcode, label: "E-ticket & Check-in" },
    ],
  },
  {
    label: "Đơn hàng & Thanh toán",
    items: [
      { href: "/admin/orders", icon: ShoppingCart, label: "Đơn mua vé" },
      { href: "/admin/payments", icon: CreditCard, label: "Thanh toán" },
      { href: "/admin/revenue", icon: TrendingUp, label: "Doanh thu & Phí sàn" },
      { href: "/admin/refunds", icon: RefreshCw, label: "Hoàn tiền & Khiếu nại" },
    ],
  },
  {
    label: "Nội dung & Hệ thống",
    items: [
      { href: "/admin/reviews", icon: Star, label: "Đánh giá & Phản hồi" },
      { href: "/admin/categories", icon: Tags, label: "Danh mục sự kiện" },
      { href: "/admin/staff", icon: BarChart3, label: "Quản trị & Phân quyền" },
    ],
  },
];

function NavItem({ item, collapsed, active }: { item: any; collapsed: boolean; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border">
          {item.label}
        </div>
      )}
    </Link>
  );
}

export default function AdminShell({ children, session }: { children: React.ReactNode; session: Session }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== "/admin";
  };

  const user = session?.user as any;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-2 px-4 py-4 border-b border-border/50", collapsed && "justify-center px-2")}>
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Lumora Admin"
            className="h-8 w-auto object-contain"
          />
          {!collapsed && (
            <span className="text-[10px] bg-[#EB5B95] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0">
              Admin
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={isActive(item.href, (item as any).exact)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User & Logout */}
      <div className={cn("border-t border-border/50 p-3 space-y-1", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-2.5 px-2 py-2 rounded-xl bg-muted/50", collapsed && "justify-center px-1")}>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={user?.image || user?.avatar} />
            <AvatarFallback className="text-xs bg-primary text-white font-bold">
              {user?.name?.[0] || "A"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn("w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl gap-2", collapsed && "justify-center px-2")}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span className="text-xs">Đăng xuất</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 bg-background border-r border-border/50 transition-all duration-300 shadow-sm",
          collapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center shadow-md hover:bg-muted transition-colors z-50"
        >
          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", collapsed ? "" : "rotate-180")} />
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[240px] bg-background flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={cn("flex flex-col flex-1 min-w-0 transition-all duration-300", collapsed ? "lg:pl-[60px]" : "lg:pl-[240px]")}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-14 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 gap-4">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb placeholder */}
          <div className="hidden lg:block" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-8">
                Xem website
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
