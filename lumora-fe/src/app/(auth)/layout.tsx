import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Sparkles, Ticket, CreditCard, Clock } from "lucide-react";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Form panel */}
      <div className="flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="inline-block hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Lumora Logo"
                width={140}
                height={44}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>

      {/* Right: Branding panel */}
      <div className="hidden md:flex flex-col justify-center items-center bg-primary/15 p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />

        <div className="z-10 text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl font-extrabold text-foreground leading-tight">
            Thắp Sáng Những Khoảnh Khắc Đẹp Nhất
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Khám phá và đặt vé cho những sự kiện âm nhạc, văn hóa, thể thao đỉnh cao xung quanh bạn.
          </p>

          <div className="pt-4 space-y-3">
            {[
              { icon: Ticket, text: "Vé điện tử mã vạch tiện lợi" },
              { icon: CreditCard, text: "Thanh toán VietQR an toàn" },
              { icon: Clock, text: "Giữ chỗ tự động 15 phút" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm bg-background/60 backdrop-blur-sm rounded-xl px-4 py-3 text-left shadow-xs border border-border/40">
                <item.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
