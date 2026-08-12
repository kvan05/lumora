"use client";

import { useState } from "react";
import { Search, HelpCircle, ChevronDown, Ticket, CreditCard, RefreshCw, ShieldCheck, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FAQS = [
  {
    category: "Đặt vé & Thanh toán",
    icon: CreditCard,
    questions: [
      {
        q: "Tôi có thể thanh toán bằng những phương thức nào?",
        a: "Lumora hỗ trợ thanh toán qua VietQR / PayOS kết nối hơn 40 ngân hàng tại Việt Nam (Vietcombank, Techcombank, MB, ACB, VPBank, ...)."
      },
      {
        q: "Sau khi chuyển khoản bao lâu thì tôi nhận được vé?",
        a: "Giao dịch được xác nhận tự động trong vòng 5 - 30 giây sau khi chuyển khoản thành công. Vé điện tử sẽ hiển thị ngay trong mục 'Vé của tôi'."
      },
      {
        q: "Tôi nhập sai nội dung chuyển khoản thì sao?",
        a: "Hệ thống sẽ giữ vé trong 15 phút. Nếu quá 15 phút chưa tự động xác nhận, vui lòng liên hệ bộ phận hỗ trợ khách hàng kèm biên lai chuyển khoản."
      }
    ]
  },
  {
    category: "Vé điện tử & Check-in",
    icon: Ticket,
    questions: [
      {
        q: "Vé điện tử (E-ticket) sử dụng thế nào khi vào cổng?",
        a: "Bạn chỉ cần mở vé mã vạch trên điện thoại hoặc bản in PDF tại mục 'Chi tiết đơn hàng' để nhân viên soát vé quét mã vạch tại cổng."
      },
      {
        q: "Một vé mã vạch có thể sử dụng mấy lần?",
        a: "Mỗi vé có một mã vạch duy nhất và chỉ có giá trị cho một lần quét duy nhất. Vui lòng giữ bảo mật mã vạch của bạn."
      },
      {
        q: "Tôi có thể chụp màn hình vé mã vạch gửi cho bạn bè được không?",
        a: "Được. Tuy nhiên nếu vé của bạn bị quét trước bởi người khác, hệ thống sẽ từ chối vé đến sau."
      }
    ]
  },
  {
    category: "Đổi trả & Hoàn tiền",
    icon: RefreshCw,
    questions: [
      {
        q: "Vé đã mua có được hủy hoặc hoàn tiền không?",
        a: "Tùy thuộc vào quy định của từng Ban tổ chức. Bạn có thể nhấn nút 'Yêu cầu hoàn tiền' trong trang Chi tiết đơn hàng để gửi yêu cầu."
      },
      {
        q: "Trường hợp sự kiện bị hủy thì xử lý ra sao?",
        a: "Nếu sự kiện bị hủy từ phía Ban tổ chức, Lumora sẽ tự động hoàn 100% tiền vé về tài khoản ngân hàng của bạn trong vòng 3-5 ngày làm việc."
      }
    ]
  }
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm">
          <HelpCircle className="h-4 w-4" /> Trung tâm trợ giúp
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Câu hỏi thường gặp (FAQ)</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Tìm kiếm câu trả lời nhanh chóng cho các thắc mắc về mua vé, thanh toán và sử dụng vé điện tử tại Lumora.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto pt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm câu hỏi (vd: thanh toán, đổi vé, qr code)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-border/80 text-base shadow-sm"
          />
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {FAQS.map((cat, catIdx) => {
          const Icon = cat.icon;
          const filteredQuestions = cat.questions.filter(
            (item) =>
              item.q.toLowerCase().includes(search.toLowerCase()) ||
              item.a.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredQuestions.length === 0) return null;

          return (
            <div key={catIdx} className="space-y-4">
              <div className="flex items-center gap-3 border-b pb-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-extrabold">{cat.category}</h2>
              </div>

              <div className="space-y-3">
                {filteredQuestions.map((item, qIdx) => {
                  const id = `${catIdx}-${qIdx}`;
                  const isOpen = openIndex === id;

                  return (
                    <div
                      key={qIdx}
                      className="border border-border/70 rounded-2xl bg-card overflow-hidden transition-all duration-200"
                    >
                      <button
                        onClick={() => toggleAccordion(id)}
                        className="w-full p-5 text-left font-bold flex justify-between items-center gap-4 hover:bg-muted/30 transition-colors"
                      >
                        <span className="text-base text-foreground">{item.q}</span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-primary" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Still need help CTA */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold">Vẫn cần sự trợ giúp?</h3>
          <p className="text-sm text-muted-foreground">
            Đội ngũ chăm sóc khách hàng của Lumora luôn sẵn sàng 24/7.
          </p>
        </div>
        <Button size="lg" className="rounded-full font-bold shadow-md shrink-0 gap-2" asChild>
          <Link href="/support">
            <Mail className="h-4 w-4" /> Gửi yêu cầu hỗ trợ
          </Link>
        </Button>
      </div>
    </div>
  );
}
