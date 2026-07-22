"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutDashboard, Settings, Ticket, Users } from "lucide-react";

export function SellerNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Tổng quan", href: "/seller/dashboard", icon: LayoutDashboard },
    { name: "Sự kiện", href: "/seller/events", icon: Calendar },
    { name: "Đơn hàng", href: "/seller/orders", icon: Ticket },
    { name: "Khách hàng", href: "/seller/customers", icon: Users },
  ];

  const bottomNavItems = [
    { name: "Cài đặt", href: "/profile", icon: Settings },
  ];

  const renderLink = (item: any) => {
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
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-4">
      <nav className="grid items-start px-4 space-y-1">
        <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-2 mb-1">
          Quản lý chính
        </div>
        {navItems.map(renderLink)}
      </nav>

      <nav className="grid items-start px-4 space-y-1 mt-auto pb-4">
        <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-2 mb-1">
          Tài khoản
        </div>
        {bottomNavItems.map(renderLink)}
      </nav>
    </div>
  );
}
