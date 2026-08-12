"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Đã gửi yêu cầu hỗ trợ thành công!");
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-10">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm">
          <MessageSquare className="h-4 w-4" /> Đội ngũ CSKH
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Liên hệ Hỗ trợ Lumora</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Chúng tôi ở đây để giải đáp mọi thắc mắc về đơn hàng, thanh toán và trải nghiệm sự kiện của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Contact Info Cards */}
        <div className="space-y-4">
          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Email Hỗ trợ</h3>
                <p className="text-sm text-muted-foreground mt-0.5">support@lumora.pro.vn</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Phản hồi trong 2 giờ</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Hotline 24/7</h3>
                <p className="text-sm font-extrabold text-foreground mt-0.5">1900 6868</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Cước phí 1.000đ/phút</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Văn phòng đại diện</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Toà nhà Lumora Tower, Q.1, TP. Hồ Chí Minh</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-2">
          <Card className="rounded-3xl border border-border/60 shadow-md">
            <CardContent className="p-8">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-extrabold">Cảm ơn bạn đã liên hệ!</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Yêu cầu hỗ trợ của bạn đã được tiếp nhận. Nhân viên CSKH sẽ phản hồi qua email <strong>{email}</strong> trong thời gian sớm nhất.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-full font-bold"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                      setSubject("");
                    }}
                  >
                    Gửi yêu cầu khác
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-xl font-extrabold">Gửi tin nhắn hỗ trợ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">Họ và tên *</label>
                      <Input
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-muted-foreground">Email *</label>
                      <Input
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Tiêu đề / Mã đơn hàng</label>
                    <Input
                      placeholder="Mã đơn LUM-12345 hoặc tiêu đề sự cố..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Nội dung thắc mắc *</label>
                    <Textarea
                      placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="min-h-[140px] resize-none rounded-xl"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-base font-bold rounded-xl shadow-md gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu hỗ trợ"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
