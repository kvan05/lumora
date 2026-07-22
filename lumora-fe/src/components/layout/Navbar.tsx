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
} from "lucide-react";
import { useState } from "react";

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
