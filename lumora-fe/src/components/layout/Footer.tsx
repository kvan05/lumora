import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border/60 py-14 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="text-2xl font-extrabold text-primary">
              Lumora
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Thắp sáng những khoảnh khắc đẹp nhất. Nền tảng đặt vé sự kiện hàng đầu Việt Nam.
            </p>
          </div>

          {/* Explore */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Khám phá</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/events" className="hover:text-primary transition-colors">
                  Tất cả sự kiện
                </Link>
              </li>
              <li>
                <Link href="/events?category=Âm nhạc" className="hover:text-primary transition-colors">
                  Âm nhạc
                </Link>
              </li>
              <li>
                <Link href="/events?category=Thể thao" className="hover:text-primary transition-colors">
                  Thể thao
                </Link>
              </li>
              <li>
                <Link href="/events?category=Sân khấu" className="hover:text-primary transition-colors">
                  Sân khấu & Nghệ thuật
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Tài khoản</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-primary transition-colors">
                  Vé của tôi
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors">
                  Hồ sơ cá nhân
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Organizers */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Hỗ trợ & Hợp tác</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-primary transition-colors">
                  Liên hệ hỗ trợ
                </Link>
              </li>
              <li>
                <Link href="/seller/dashboard" className="hover:text-primary transition-colors">
                  Tổ chức sự kiện cùng Lumora
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Lumora. Tất cả các quyền được bảo lưu.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</Link>
            <Link href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
