"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Ticket, Users,
  BarChart3, Wallet, QrCode, Settings, LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";

export function SellerNav() {
  const pathname = usePathname();

  const navGroups = [
    {
      title: "Quản lý",
      items: [
        { name: "Tổng quan", href: "/seller/dashboard", icon: LayoutDashboard },
        { name: "Sự kiện", href: "/seller/events", icon: Calendar },
        { name: "Đơn hàng", href: "/seller/orders", icon: Ticket },
        { name: "Khách hàng", href: "/seller/customers", icon: Users },
      ],
    },
    {
      title: "Công cụ",
      items: [
        { name: "Thống kê & Báo cáo", href: "/seller/analytics", icon: BarChart3 },
        { name: "Tài chính", href: "/seller/finance", icon: Wallet },
        { name: "Check-in Scanner", href: "/seller/checkin", icon: QrCode },
      ],
    },
  ];

  const renderLink = (item: { name: string; href: string; icon: any }) => {
    const Icon = item.icon;
    const isActive = pathname?.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all font-medium text-sm ${
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto">
      <nav className="px-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-2 mb-1">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map(renderLink)}
            </div>
          </div>
        ))}
      </nav>

      <nav className="px-4 space-y-1 mt-6 pb-2">
        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-2 mb-1">
          Tài khoản
        </p>
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all font-medium text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        >
          <Settings className="h-5 w-5 shrink-0" />
          Cài đặt hồ sơ
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all font-medium text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Đăng xuất
        </button>
      </nav>
    </div>
  );
}
