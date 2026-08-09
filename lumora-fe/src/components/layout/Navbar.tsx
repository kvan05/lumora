"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Ticket,
  User,
  Heart,
  LogOut,
  ChevronDown,
  Menu,
  PlusCircle,
  Sparkles,
  LayoutDashboard
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { name: "Tất cả", href: "/events" },
    { name: "Concert & Âm nhạc", href: "/events?category=" + encodeURIComponent("Concert & Live Show") },
    { name: "City Tour & Bus 2 tầng", href: "/events?category=" + encodeURIComponent("City Tour & Bus 2 tầng") },
    { name: "Water Bus & Du thuyền", href: "/events?category=" + encodeURIComponent("Water Bus & Du thuyền") },
    { name: "Tham quan & Di sản", href: "/events?category=" + encodeURIComponent("Tham quan địa điểm") },
    { name: "Sân khấu & Kịch", href: "/events?category=" + encodeURIComponent("Sân khấu & Kịch") },
    { name: "Thể Thao", href: "/events?category=" + encodeURIComponent("Thể thao & Giải đấu") },
    { name: "Workshop", href: "/events?category=" + encodeURIComponent("Workshop & Lớp học") },
    { name: "Công viên & Giải trí", href: "/events?category=" + encodeURIComponent("Công viên chủ đề") },
    { name: "Ẩm thực", href: "/events?category=" + encodeURIComponent("Lễ hội Ẩm thực") },
    { name: "Khác", href: "/events?category=" + encodeURIComponent("Khác") },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (href: string) => {
    if (!href.includes("?")) return pathname === href && !searchParams.get("category");
    const catParam = new URLSearchParams(href.split("?")[1] || "").get("category");
    return pathname === "/events" && searchParams.get("category") === catParam;
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-xs">
      {/* ── Top Bar (Soft Mint Pastel #DFF5ED) ── */}
      <div className="bg-[#DFF5ED] dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b border-emerald-200/60 dark:border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Custom Brand Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 group py-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Lumora Logo"
              className="h-14 sm:h-[56px] md:h-[60px] max-h-16 w-auto object-contain scale-110 sm:scale-125 origin-left group-hover:scale-130 transition-transform duration-300 drop-shadow-md"
            />
          </Link>

          {/* Integrated Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl mx-4 items-center bg-white dark:bg-slate-800 rounded-xl p-1 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/60 dark:border-slate-700"
          >
            <Input
              type="text"
              placeholder="Bạn tìm gì hôm nay?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-none focus-visible:ring-0 shadow-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent h-8 flex-1"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-[#93C453] hover:bg-[#82B342] text-slate-900 font-extrabold h-8 px-4 rounded-lg text-xs transition-colors"
            >
              Tìm kiếm
            </Button>
          </form>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Create Event CTA */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-[#F7A8C4] text-[#F7A8C4] bg-white/70 dark:bg-slate-800 hover:bg-[#F7A8C4] hover:text-white font-bold rounded-full text-xs transition-all h-9 px-4 hidden sm:flex shadow-xs"
            >
              <Link href={(session?.user as any)?.role === "SELLER" ? "/seller/events/create" : "/become-organizer"}>
                <PlusCircle className="mr-1.5 h-4 w-4" /> Tạo sự kiện
              </Link>
            </Button>

            {/* My Tickets Shortcut */}
            {session ? (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-slate-800 dark:text-slate-100 hover:bg-white/40 font-semibold text-xs h-9 px-3 hidden sm:flex"
              >
                <Link href="/orders" className="flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-[#EB5B95]" /> Vé của tôi
                </Link>
              </Button>
            ) : null}

            {/* Account / Auth */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-900 dark:text-slate-100 hover:bg-white/40 font-bold text-xs h-9 px-2.5 rounded-full flex items-center gap-1.5"
                  >
                    <Avatar className="h-7 w-7 border border-[#EB5B95]/40">
                      <AvatarImage src={(session.user as any)?.image || ""} />
                      <AvatarFallback className="text-xs font-bold bg-[#EB5B95] text-white">
                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline max-w-[100px] truncate">{session.user?.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl shadow-xl mt-2" align="end">
                  <div className="p-3 pb-2 border-b">
                    <p className="text-sm font-bold text-slate-900 truncate">{session.user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
                  </div>

                  {(session.user as any)?.role === "SELLER" && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/seller/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-[#93C453]" />
                        <span>Quản lý sự kiện</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/orders" className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-[#EB5B95]" />
                      <span>Vé của tôi</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile/favorites" className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-[#EB5B95]" />
                      <span>Sự kiện yêu thích</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#93C453]" />
                      <span>Tài khoản cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-slate-900 dark:text-slate-100 hover:bg-white/40 font-bold text-xs h-9 px-3"
                >
                  <Link href="/login">Tài khoản</Link>
                </Button>
              </div>
            )}

            {/* Theme Toggle (Light / Dark Mode) */}
            <div className="flex items-center">
              <ThemeToggle />
            </div>

            {/* Language Flag Badge */}
            <div className="flex items-center gap-1 bg-white/40 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 rounded-full text-xs font-semibold cursor-pointer border border-slate-300/40">
              <span>🇻🇳</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </div>

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-900 dark:text-slate-100 hover:bg-white/40"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Category Bar (#845D3E Background / #DFF5ED Text) ── */}
      <div className="bg-[#845D3E] text-[#DFF5ED] text-xs md:text-sm font-bold border-b border-[#704E33] overflow-x-auto scrollbar-none shadow-xs">
        <div className="container mx-auto px-4 flex items-center gap-6 py-2.5 whitespace-nowrap">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className={`hover:text-white transition-colors ${isActive(cat.href) ? "text-white font-black underline underline-offset-4" : "text-[#DFF5ED]"
                }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Search & Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Bạn tìm gì hôm nay?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border-slate-300 text-slate-900 text-sm"
            />
            <Button type="submit" size="sm" className="bg-[#4A7C59] text-white">
              Tìm
            </Button>
          </form>
          <div className="pt-2 flex flex-col gap-2 text-slate-800 text-sm font-semibold">
            <Link href="/seller/events/create" className="py-2 px-3 hover:bg-slate-100 rounded-lg">
              + Tạo sự kiện
            </Link>
            <Link href="/orders" className="py-2 px-3 hover:bg-slate-100 rounded-lg">
              🎟️ Vé của tôi
            </Link>
            {!session && (
              <Link href="/login" className="py-2 px-3 hover:bg-slate-100 rounded-lg text-[#4A7C59] font-bold">
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
