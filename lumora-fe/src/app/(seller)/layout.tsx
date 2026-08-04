import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SellerNav } from "@/components/layout/SellerNav";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default async function SellerLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session || (session.user as any).role !== "SELLER") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur z-30 flex items-center justify-between px-4 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Lumora Seller" className="h-8 w-auto object-contain" />
          <span className="text-[10px] bg-[#93C453] text-slate-900 px-2 py-0.5 rounded-full font-black uppercase">Seller</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 flex flex-col">
              <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Lumora" className="h-8 w-auto object-contain" />
                  <span className="text-[10px] bg-[#93C453] text-slate-900 px-2 py-0.5 rounded-full font-black uppercase">Seller</span>
                </Link>
              </div>
              <SellerNav />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r bg-card/60 backdrop-blur-xl lg:flex shadow-sm">
        <div className="flex h-20 items-center px-6 border-b border-border/40">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Lumora Seller" className="h-9 w-auto object-contain" />
            <span className="text-[10px] bg-[#93C453] text-slate-900 px-2 py-0.5 rounded-full font-black uppercase shrink-0">Seller</span>
          </Link>
        </div>
        <SellerNav />
        <div className="mt-auto p-4 border-t border-border/40 bg-card/50">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground truncate w-40">{session.user?.name}</span>
              <span className="text-xs text-muted-foreground truncate w-40">{session.user?.email}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full lg:pl-72 pt-16 lg:pt-0">
        <main className="flex-1 items-start p-4 sm:p-8 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
